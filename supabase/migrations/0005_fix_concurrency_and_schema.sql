-- 0005_fix_concurrency_and_schema.sql

-- 1. Create booking_units junction table to support qty > 1
create table booking_units (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  room_unit_id uuid not null references room_units(id) on delete cascade,
  created_at timestamptz default now(),
  unique(booking_id, room_unit_id)
);

alter table booking_units enable row level security;
create policy "admin manage booking_units" on booking_units
  for all using (is_admin()) with check (is_admin());

-- 2. Migrate any existing assignments (if any exist)
insert into booking_units (booking_id, room_unit_id)
select id, room_unit_id from bookings where room_unit_id is not null;

-- 3. Drop the flawed column from bookings
alter table bookings drop column room_unit_id;

-- 4. Atomic RPC: Create pending booking (prevents overbooking race condition)
create or replace function create_pending_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guests_count int,
  p_qty int,
  p_total_amount numeric,
  p_notes text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_available boolean;
  v_booking_id uuid;
begin
  -- Lock the room type to serialize concurrent booking attempts for this room type
  perform 1 from room_types where id = p_room_type_id for update;

  -- Re-check availability (safe because concurrent transactions queue up behind the lock)
  v_available := check_availability(p_room_type_id, p_check_in, p_check_out, p_qty);

  if not v_available then
    raise exception 'Selected dates are no longer available for this room type';
  end if;

  -- Insert pending booking
  insert into bookings (
    room_type_id,
    guest_name,
    guest_email,
    guest_phone,
    check_in,
    check_out,
    guests_count,
    qty,
    total_amount,
    status,
    payment_status,
    hold_expires_at,
    source,
    notes
  ) values (
    p_room_type_id,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_check_in,
    p_check_out,
    p_guests_count,
    p_qty,
    p_total_amount,
    'pending',
    'unpaid',
    now() + interval '15 minutes',
    'online',
    p_notes
  ) returning id into v_booking_id;

  return v_booking_id;
end;
$$;

-- 5. Atomic RPC: Confirm booking and assign units (prevents physical double-booking)
create or replace function confirm_booking_and_assign_units(
  p_booking_id uuid,
  p_payment_id text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_booking record;
  v_unit record;
  v_assigned_count int := 0;
begin
  -- Lock the booking row
  select * into v_booking
  from bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'confirmed' then
    -- Already confirmed (idempotency for webhook vs frontend callback)
    return true;
  end if;

  -- Assign units using SKIP LOCKED to safely grab available physical rooms concurrently
  for v_unit in 
    select ru.id 
    from room_units ru
    where ru.room_type_id = v_booking.room_type_id
      and ru.is_active = true
      and not exists (
        select 1 from availability_blocks ab
        where ab.room_unit_id = ru.id
          and ab.start_date < v_booking.check_out 
          and ab.end_date > v_booking.check_in
      )
      and not exists (
        select 1 from booking_units bu
        join bookings b on b.id = bu.booking_id
        where bu.room_unit_id = ru.id
          and b.status = 'confirmed'
          and b.check_in < v_booking.check_out 
          and b.check_out > v_booking.check_in
      )
    for update skip locked
    limit v_booking.qty
  loop
    insert into booking_units (booking_id, room_unit_id)
    values (v_booking.id, v_unit.id);
    v_assigned_count := v_assigned_count + 1;
  end loop;

  update bookings
  set 
    status = 'confirmed',
    payment_status = 'paid',
    hold_expires_at = null,
    razorpay_payment_id = p_payment_id,
    updated_at = now()
  where id = p_booking_id;

  return true;
end;
$$;

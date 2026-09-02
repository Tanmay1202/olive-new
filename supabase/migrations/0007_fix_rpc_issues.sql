-- 0007_fix_rpc_issues.sql

-- Fix Issue 3: change check_availability from STABLE to VOLATILE
-- STABLE is incorrect because concurrent bookings change what this function returns
create or replace function check_availability(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_qty int default 1
)
returns boolean
language plpgsql
volatile            -- was: stable
security definer
as $$
declare
  v_total_units int;
  v_booked int;
  v_blocked int;
begin
  select total_units into v_total_units
  from room_types where id = p_room_type_id and is_active = true;

  if v_total_units is null then
    return false;
  end if;

  select coalesce(sum(qty), 0) into v_booked
  from bookings
  where room_type_id = p_room_type_id
    and check_in < p_check_out and check_out > p_check_in
    and (
      status = 'confirmed'
      or (status = 'pending' and hold_expires_at > now())
    );

  select count(*) into v_blocked
  from availability_blocks ab
  join room_units ru on ru.id = ab.room_unit_id
  where ru.room_type_id = p_room_type_id
    and ab.start_date < p_check_out and ab.end_date > p_check_in;

  return (v_total_units - v_booked - v_blocked) >= p_qty;
end;
$$;


-- Fix Issues 1 & 5: rewrite confirm_booking_and_assign_units with:
--   a) p_payment_status param (Issue 1 — manual bookings used wrong status)
--   b) guard that raises an exception if not enough units can be assigned (Issue 5)
create or replace function confirm_booking_and_assign_units(
  p_booking_id uuid,
  p_payment_id text,
  p_payment_status text default 'paid'
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
  -- Lock the booking row — this serialises concurrent webhook + frontend calls
  select * into v_booking
  from bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  -- Idempotency: already confirmed (webhook raced the frontend callback, or duplicate call)
  if v_booking.status = 'confirmed' then
    return true;
  end if;

  -- Assign physical units using SKIP LOCKED — concurrent calls skip rows locked by others
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

  -- Issue 5 fix: if we could not assign enough physical rooms, abort.
  -- This protects against edge cases where maintenance blocks were added
  -- after the booking hold was created but before payment confirmed.
  if v_assigned_count < v_booking.qty then
    raise exception
      'Could not assign enough physical rooms (needed %, got %). Please contact the property.',
      v_booking.qty, v_assigned_count;
  end if;

  -- Confirm the booking with the caller-supplied payment status
  update bookings set
    status = 'confirmed',
    payment_status = p_payment_status,  -- Issue 1 fix: was hard-coded 'paid'
    hold_expires_at = null,
    razorpay_payment_id = p_payment_id,
    updated_at = now()
  where id = p_booking_id;

  return true;
end;
$$;


-- Fix Issue 1 (continued): update create_manual_booking to pass payment_status through
create or replace function create_manual_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guests_count int,
  p_qty int,
  p_total_amount numeric,
  p_payment_status text,
  p_notes text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
begin
  -- Validate p_payment_status — only 'paid' or 'unpaid' are valid for manual bookings
  if p_payment_status not in ('paid', 'unpaid') then
    raise exception 'Invalid payment_status: must be paid or unpaid';
  end if;

  -- Atomically check availability, lock, and insert as pending
  v_booking_id := create_pending_booking(
    p_room_type_id,
    p_check_in,
    p_check_out,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_guests_count,
    p_qty,
    p_total_amount,
    p_notes
  );

  -- Override source to manual (create_pending_booking always inserts 'online')
  update bookings
  set source = 'manual'
  where id = v_booking_id;

  -- Atomically assign physical units and confirm, passing through the real payment status
  perform confirm_booking_and_assign_units(
    v_booking_id,
    'manual_' || gen_random_uuid()::text,
    p_payment_status   -- Issue 1 fix: was not passed, defaulted to 'paid'
  );

  return v_booking_id;
end;
$$;

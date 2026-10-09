-- 0010_support_paid_status_alias.sql

create or replace function get_room_types_with_availability(
  p_check_in date,
  p_check_out date
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  max_occupancy int,
  base_price numeric(10,2),
  amenities jsonb,
  images jsonb,
  total_units int,
  is_active boolean,
  display_order int,
  created_at timestamptz,
  updated_at timestamptz,
  available_units int,
  is_available boolean
)
language plpgsql
stable
security definer
as $$
begin
  return query
  select
    rt.id,
    rt.name,
    rt.slug,
    rt.description,
    rt.max_occupancy,
    rt.base_price,
    rt.amenities,
    rt.images,
    rt.total_units,
    rt.is_active,
    rt.display_order,
    rt.created_at,
    rt.updated_at,
    greatest(0, (
      rt.total_units -
      (
        select coalesce(sum(qty), 0)::int
        from bookings b
        where b.room_type_id = rt.id
          and b.check_in < p_check_out and b.check_out > p_check_in
          and (
            b.status in ('confirmed', 'paid')
            or (b.status = 'pending' and b.hold_expires_at > now())
          )
      ) -
      (
        select count(*)::int
        from availability_blocks ab
        join room_units ru on ru.id = ab.room_unit_id
        where ru.room_type_id = rt.id
          and ab.start_date < p_check_out and ab.end_date > p_check_in
      )
    )) as available_units,
    (
      (
        rt.total_units -
        (
          select coalesce(sum(qty), 0)::int
          from bookings b
          where b.room_type_id = rt.id
            and b.check_in < p_check_out and b.check_out > p_check_in
            and (
              b.status in ('confirmed', 'paid')
              or (b.status = 'pending' and b.hold_expires_at > now())
            )
        ) -
        (
          select count(*)::int
          from availability_blocks ab
          join room_units ru on ru.id = ab.room_unit_id
          where ru.room_type_id = rt.id
            and ab.start_date < p_check_out and ab.end_date > p_check_in
        )
      ) > 0
    ) as is_available
  from room_types rt
  where rt.is_active = true
  order by rt.display_order;
end;
$$;


create or replace function check_availability(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_qty int default 1
)
returns boolean
language plpgsql
volatile
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
      status in ('confirmed', 'paid')
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
  select * into v_booking
  from bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking.status in ('confirmed', 'paid') then
    return true;
  end if;

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
          and b.status in ('confirmed', 'paid')
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

  if v_assigned_count < v_booking.qty then
    raise exception 'Could not assign enough physical rooms (needed %, got %).', v_booking.qty, v_assigned_count;
  end if;

  update bookings set
    status = 'confirmed',
    payment_status = p_payment_status,
    hold_expires_at = null,
    razorpay_payment_id = p_payment_id,
    updated_at = now()
  where id = p_booking_id;

  return true;
end;
$$;

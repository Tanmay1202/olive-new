create or replace function check_availability(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_qty int default 1
)
returns boolean
language plpgsql
stable
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

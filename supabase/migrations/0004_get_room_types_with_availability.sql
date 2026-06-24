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
    -- calculate available units: total_units - booked - blocked
    greatest(0, (
      rt.total_units -
      (
        select coalesce(sum(qty), 0)::int
        from bookings b
        where b.room_type_id = rt.id
          and b.check_in < p_check_out and b.check_out > p_check_in
          and (
            b.status = 'confirmed'
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
    -- is available check
    (
      (
        rt.total_units -
        (
          select coalesce(sum(qty), 0)::int
          from bookings b
          where b.room_type_id = rt.id
            and b.check_in < p_check_out and b.check_out > p_check_in
            and (
              b.status = 'confirmed'
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
  order by rt.display_order asc;
end;
$$;

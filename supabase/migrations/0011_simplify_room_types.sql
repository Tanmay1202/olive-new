-- 0011_simplify_room_types.sql

-- 1. Create a "Standard Room" if no active room type exists, or pick the first one.
DO $$
DECLARE
  v_standard_id uuid;
BEGIN
  -- Try to find an existing one to use as the base
  SELECT id INTO v_standard_id FROM room_types ORDER BY created_at ASC LIMIT 1;
  
  IF v_standard_id IS NULL THEN
    -- Fallback just in case
    INSERT INTO room_types (name, slug, description, max_occupancy, base_price, total_units)
    VALUES ('Standard Room', 'standard-room', 'Our standard offering', 3, 3500.00, 12)
    RETURNING id INTO v_standard_id;
  ELSE
    -- Update the chosen one to be 'Standard Room' and aggregate the units/price
    UPDATE room_types 
    SET name = 'Standard Room', 
        slug = 'standard-room',
        total_units = (SELECT sum(total_units) FROM room_types),
        is_active = true
    WHERE id = v_standard_id;
  END IF;

  -- 2. Move all room_units to the new standard room
  UPDATE room_units SET room_type_id = v_standard_id;

  -- 3. Move all bookings to the new standard room
  UPDATE bookings SET room_type_id = v_standard_id;

  -- 4. Delete all other room types
  DELETE FROM room_types WHERE id != v_standard_id;

END $$;

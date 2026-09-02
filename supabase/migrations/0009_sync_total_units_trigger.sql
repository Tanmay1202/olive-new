-- 0009_sync_total_units_trigger.sql
-- Automatically keeps room_types.total_units in sync with the actual
-- count of active room_units rows. This prevents total_units from drifting
-- out of sync when units are added/removed/toggled from the admin panel,
-- which would cause check_availability to report wrong numbers.

create or replace function sync_room_type_total_units()
returns trigger language plpgsql security definer as $$
begin
  -- Works for both INSERT, UPDATE and DELETE on room_units
  -- After any change, recount the active units for the affected room type
  update room_types
  set total_units = (
    select count(*)
    from room_units
    where room_type_id = coalesce(NEW.room_type_id, OLD.room_type_id)
      and is_active = true
  ),
  updated_at = now()
  where id = coalesce(NEW.room_type_id, OLD.room_type_id);

  return coalesce(NEW, OLD);
end;
$$;

-- Fire after any insert, update, or delete on room_units
drop trigger if exists trg_sync_total_units on room_units;
create trigger trg_sync_total_units
  after insert or update or delete on room_units
  for each row execute function sync_room_type_total_units();

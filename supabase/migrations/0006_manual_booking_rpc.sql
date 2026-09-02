-- 0006_manual_booking_rpc.sql

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
  -- 1. Create a pending booking using the existing atomic RPC
  -- This locks the room type, checks availability, and inserts
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

  -- 2. Update to manual source and payment status
  update bookings
  set 
    source = 'manual',
    payment_status = p_payment_status
  where id = v_booking_id;

  -- 3. Confirm and assign physical units
  -- This locks and assigns the physical rooms based on qty
  perform confirm_booking_and_assign_units(v_booking_id, 'manual_' || gen_random_uuid()::text);

  return v_booking_id;
end;
$$;

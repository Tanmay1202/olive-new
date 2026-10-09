-- Allow admins to delete bookings
create policy "admin delete bookings" on bookings
  for delete using (is_admin());

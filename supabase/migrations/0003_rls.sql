alter table profiles enable row level security;
alter table room_types enable row level security;
alter table room_units enable row level security;
alter table bookings enable row level security;
alter table availability_blocks enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'));
$$;

-- room_types: public can read active types, admins can do everything
create policy "public read active room types" on room_types
  for select using (is_active = true or is_admin());
create policy "admin manage room types" on room_types
  for all using (is_admin()) with check (is_admin());

-- room_units: admin only
create policy "admin manage room units" on room_units
  for all using (is_admin()) with check (is_admin());

-- availability_blocks: public can read (so booking form can show "unavailable"), admin manages
create policy "public read blocks" on availability_blocks
  for select using (true);
create policy "admin manage blocks" on availability_blocks
  for all using (is_admin()) with check (is_admin());

-- bookings: NO public access at all. All booking writes go through Edge Functions
-- using the service role key. Admins can read/update everything via dashboard.
create policy "admin read bookings" on bookings
  for select using (is_admin());
create policy "admin update bookings" on bookings
  for update using (is_admin()) with check (is_admin());
create policy "admin insert bookings" on bookings
  for insert with check (is_admin());  -- for manual bookings entered in dashboard

-- profiles: users can read their own row; admin can read all
create policy "read own profile" on profiles
  for select using (id = auth.uid() or is_admin());

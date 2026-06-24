-- Admin/staff users (mirrors auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin','staff')),
  created_at timestamptz default now()
);

-- The 12 villa/room categories shown on the public site
create table room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  max_occupancy int not null default 2,
  base_price numeric(10,2) not null,
  amenities jsonb not null default '[]',
  images jsonb not null default '[]',     -- array of Supabase Storage URLs
  total_units int not null default 1,     -- how many physical rooms of this type exist
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Individual physical rooms/villas — used for maintenance blocks & manual assignment
create table room_units (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references room_types(id) on delete cascade,
  unit_label text not null,               -- e.g. "Villa 7", "Room 12B"
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Bookings (both online + manually entered by admin)
create table bookings (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references room_types(id),
  room_unit_id uuid references room_units(id),   -- assigned on confirmation (nullable until then)
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  guests_count int not null default 1,
  qty int not null default 1,                     -- number of units booked (usually 1)
  total_amount numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','expired','completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded','failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  hold_expires_at timestamptz,                    -- null once confirmed; used to auto-expire pending holds
  source text not null default 'online' check (source in ('online','manual')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in)
);

create index idx_bookings_dates on bookings (room_type_id, check_in, check_out);
create index idx_bookings_status on bookings (status, payment_status);

-- Admin-set maintenance/blackout blocks per physical unit
create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  room_unit_id uuid not null references room_units(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now(),
  constraint valid_block_dates check (end_date > start_date)
);

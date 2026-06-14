# Hotel Booking Engine — Implementation Plan

**Stack:** React (existing frontend) + Supabase (DB, Auth, Storage, Edge Functions) + Razorpay (payments) + Vercel (hosting)

**Scale assumptions:** 12 villas (room types), ≤100 physical units/rooms total — Supabase free tier (500MB DB, 1GB storage, 50K MAU auth, 500K edge function invocations) is comfortably sufficient.

This document is the source of truth for the AI agent (Antigravity CLI). Work through the phases **in order**. Do not skip ahead — each phase assumes the previous one's schema/contracts exist. At the start of every phase, the agent should re-read the relevant section of this file before writing code.

---

## 0. Guiding Principles (read this first, every time)

1. **Audit before you build.** This repo already has a working frontend and a booking form. Before creating *any* new component, file, or table, search the existing codebase for something similar. Reuse > extend > create new, in that order.
2. **Additive, not destructive.** New code lives in new files/folders (`src/admin/`, `src/lib/`, `supabase/`). Existing public-facing components, routes, and styles should only be touched when explicitly required by a phase (e.g., wiring the existing booking form to real data).
3. **One phase = one branch = one PR.** Branch naming: `feature/phaseN-<short-name>`. Merge to `main` only after the phase's "Definition of Done" checklist passes.
4. **Never put secrets in the frontend.** `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` live only in Supabase Edge Function secrets. The frontend only ever sees `SUPABASE_ANON_KEY` and `RAZORPAY_KEY_ID`.
5. **Design system = frozen.** No new colors, fonts, spacing scales, border-radii, or shadow tokens get invented for the admin panel. Phase 1 extracts whatever exists; everything after reuses it.

---

## 1. Repo & Folder Structure

Target structure (new additions marked `NEW`):

```
/
├── src/
│   ├── components/          # existing shared/public components — DO NOT restructure
│   ├── pages/ (or routes/)  # existing public pages
│   ├── admin/                              NEW
│   │   ├── layouts/
│   │   │   └── AdminLayout.tsx             NEW — sidebar + topbar shell
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx               NEW
│   │   │   ├── DashboardPage.tsx           NEW
│   │   │   ├── RoomTypesPage.tsx           NEW
│   │   │   ├── AvailabilityPage.tsx        NEW
│   │   │   └── BookingsPage.tsx            NEW
│   │   ├── components/                     NEW (admin-only UI built from shared primitives)
│   │   └── hooks/                          NEW (useAuth, useRoomTypes, useBookings, etc.)
│   ├── lib/
│   │   ├── supabaseClient.ts               NEW
│   │   └── razorpay.ts                     NEW (loads checkout.js, small helpers)
│   └── types/
│       └── database.ts                     NEW (generated Supabase types)
├── supabase/
│   ├── migrations/                         NEW — SQL migration files, numbered
│   └── functions/
│       ├── create-booking-order/           NEW — Edge Function
│       ├── verify-payment/                 NEW — Edge Function
│       ├── razorpay-webhook/               NEW — Edge Function
│       └── expire-pending-bookings/        NEW — Scheduled Edge Function
├── .env.example                            NEW
└── implementation-plan.md                  (this file)
```

If the repo already uses a different convention (e.g., `app/` for Next.js, or `routes/` for React Router), the agent should **mirror the existing convention** rather than introduce `pages/` — the structure above is illustrative, the separation principle (everything new under `admin/`, `lib/`, `supabase/`) is what matters.

---

## 2. Database Schema (Supabase / Postgres)

All schema changes go into `supabase/migrations/` as numbered SQL files (e.g., `0001_init.sql`, `0002_rls.sql`, `0003_functions.sql`). Never edit a migration that's already been applied — add a new one.

### 2.1 Tables

```sql
-- 0001_init.sql

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
```

### 2.2 Availability Function

This is the single source of truth both the booking form and the admin dashboard call.

```sql
-- 0002_functions.sql

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
```

Also add a `get_room_types_with_availability(check_in, check_out)` function later (Phase 4) that returns all active room types plus a computed `available` boolean/count, so the public booking form can do one query.

### 2.3 Row Level Security

```sql
-- 0003_rls.sql

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
```

> **Why no public insert on `bookings`?** Letting anonymous users insert directly creates a race condition for double-booking and lets people fabricate fake bookings. All online booking creation goes through `create-booking-order` (Phase 6), which runs with the service role key and re-checks availability inside the function before inserting.

---

## 3. Phased Roadmap

### Phase 1 — Design System Audit & Supabase Project Setup
**Goal:** Establish the foundation without writing any feature code yet.

- [ ] Spin up Supabase project; note project URL + anon key.
- [ ] Run `0001_init.sql`, `0002_functions.sql`, `0003_rls.sql` migrations.
- [ ] Create Storage bucket `room-images` (public read).
- [ ] **Design audit:** scan existing frontend for:
  - Tailwind config / CSS variables (colors, font families, spacing scale, radii, shadows)
  - Reusable primitives already in `src/components/` (buttons, inputs, cards, modals, badges, tables)
  - Layout patterns (header/nav structure, container widths, page padding)
  - Produce a short `DESIGN_TOKENS.md` summarizing what exists and what's missing for admin needs (e.g., if there's no `Table` or `Modal` component yet, note that it needs to be built once and reused).
- [ ] Create `src/lib/supabaseClient.ts` with typed client using env vars.
- [ ] Create `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID` (frontend), and document the server-side secrets needed later (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) as Supabase Edge Function secrets — **not** in `.env`.

**Definition of Done:** Migrations applied successfully in Supabase SQL editor; `DESIGN_TOKENS.md` committed; supabase client connects (test with a simple `select` in a scratch script).

---

### Phase 2 — Admin Auth (Login)
**Goal:** Working admin login that matches the site's visual language.

- [ ] Create an admin user manually in Supabase Auth dashboard (email/password), then insert a matching row into `profiles` with `role = 'admin'`.
- [ ] Build `src/admin/pages/LoginPage.tsx`:
  - Uses the **same** form input/button/card primitives identified in Phase 1's `DESIGN_TOKENS.md` — same border radius, spacing, font sizes, color tokens as the public site's forms (e.g., the booking form's inputs).
  - Same page chrome (background, container width/padding, logo placement) as the public site, just with a centered auth card.
  - `supabase.auth.signInWithPassword({ email, password })`.
- [ ] Add a route guard / `useAuth` hook that checks session + `profiles.role`, redirects unauthenticated users to `/admin/login`.
- [ ] Add `/admin` route(s) to the router, separate from the public route tree, but **reusing the same root layout wrapper** (fonts, global CSS) so styling doesn't diverge.

**Definition of Done:** Logging in with the seeded admin account redirects to a blank/placeholder admin dashboard; logging out returns to login; an unauthenticated visit to any `/admin/*` route redirects to login. Visual review: login page looks like it belongs to the same site (not a generic admin template).

---

### Phase 3 — Admin Shell + Room Type Management
**Goal:** Admin can view/add/edit/deactivate room types (villas) and manage physical units.

- [ ] Build `AdminLayout.tsx`: sidebar (Dashboard, Room Types, Availability, Bookings, Logout) + topbar, styled with the same header treatment (colors, typography, spacing) as the public site's nav — adapted to a sidebar layout if the public site doesn't have one, but using identical tokens.
- [ ] Build `RoomTypesPage.tsx`:
  - Table/grid listing all `room_types` (name, base price, total units, active toggle, image thumbnail).
  - "Add room type" form/modal: name, slug (auto-generate from name), description, max occupancy, base price, amenities (tag input), images (upload to `room-images` bucket), total units, active toggle.
  - Edit/deactivate existing room types.
  - Sub-section per room type to manage `room_units` (add/remove unit labels — e.g., "Villa 1"..."Villa 12" or individual room numbers).
- [ ] All CRUD via Supabase client directly (RLS allows admin full access — no edge function needed here).

**Definition of Done:** Admin can create a new room type end-to-end (including image upload), see it reflected, edit it, and toggle it inactive. UI visually consistent with `DESIGN_TOKENS.md` — reuse the `Card`/`Table`/`Modal`/`Button` components, don't fork new styled variants.

---

### Phase 4 — Wire the Public Booking Form to Real Availability
**Goal:** The existing client-side booking form now queries real data.

- [ ] Create `get_room_types_with_availability(p_check_in date, p_check_out date)` SQL function (returns active room types + computed availability via `check_availability`).
- [ ] In the existing booking form component, replace any mocked/static room data with a call to this function (via `supabase.rpc(...)`), keyed off the dates the user selects.
- [ ] Show "X available" / "Sold out" states using the existing UI patterns for availability messaging (don't invent new badge styles — check `DESIGN_TOKENS.md`).
- [ ] No changes to booking form *layout* — only data wiring.

**Definition of Done:** Selecting dates in the booking form shows real availability per villa from Supabase; an inactive room type never appears; a fully-booked date range shows as unavailable.

---

### Phase 5 — Admin Availability Management
**Goal:** Admin can block out dates (maintenance, owner stays) per unit, and see an occupancy overview.

- [ ] Build `AvailabilityPage.tsx`:
  - Calendar or date-range view per room type, showing booked ranges (from `bookings`) and blocks (from `availability_blocks`) in different colors/styles.
  - Form to add a block: select room unit(s), start date, end date, reason.
  - List/remove existing blocks.
- [ ] Use existing color tokens for status indicators (e.g., if the public site already has a "booked/unavailable" color used anywhere, reuse it).

**Definition of Done:** Admin can mark a villa unavailable for a date range; that range is immediately reflected in `check_availability` and thus on the public booking form (verify via Phase 4's flow).

---

### Phase 6 — Razorpay Integration via Edge Functions
**Goal:** Real payment flow, no secrets exposed, no double-bookings.

#### 6.1 Edge Function: `create-booking-order`
Input: room_type_id, dates, guest details, qty.
Logic (runs with service role key, inside a transaction):
1. Re-run `check_availability(...)` — reject if unavailable.
2. Insert `bookings` row with `status='pending'`, `payment_status='unpaid'`, `hold_expires_at = now() + interval '15 minutes'`.
3. Call Razorpay Orders API (`POST /v1/orders`) with amount = `total_amount * 100` (paise), `receipt = booking.id`.
4. Update the booking row with `razorpay_order_id`.
5. Return `{ booking_id, razorpay_order_id, amount, currency, key_id }` to the frontend.

#### 6.2 Frontend: Razorpay Checkout
- [ ] `src/lib/razorpay.ts`: helper to load `checkout.js` script and open the modal with the order details from 6.1.
- [ ] On the existing booking form's "Pay Now" step, call `create-booking-order`, then open Razorpay checkout with the returned `order_id`.
- [ ] On checkout success callback, call `verify-payment` (6.3) with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
- [ ] On checkout `dismiss`/failure, leave booking as `pending` (it'll auto-expire via 6.4) — show a friendly retry message using existing alert/toast styling.

#### 6.3 Edge Function: `verify-payment`
1. Recompute HMAC SHA256 signature of `order_id|payment_id` using `RAZORPAY_KEY_SECRET`, compare to `razorpay_signature`.
2. If valid: update booking → `status='confirmed'`, `payment_status='paid'`, `hold_expires_at=null`, assign a free `room_unit_id` (pick any active unit of that room type not booked/blocked for the dates).
3. If invalid: return error, leave booking pending (do not mark failed yet — webhook may still confirm).
4. (Optional, future) trigger a confirmation email here or via a separate function.

#### 6.4 Edge Function: `razorpay-webhook`
- Configure in Razorpay dashboard pointing at this function's URL.
- Verify `X-Razorpay-Signature` header using `RAZORPAY_WEBHOOK_SECRET`.
- On `payment.captured`: idempotently confirm the booking (same logic as 6.3, safe to run twice).
- On `payment.failed`: mark booking `payment_status='failed'`.
- This is the **source of truth** if the user closes the browser mid-flow — frontend confirmation (6.3) is the fast path, webhook is the safety net.

#### 6.5 Scheduled Edge Function: `expire-pending-bookings`
- Runs every 5–10 minutes (Supabase Cron / `pg_cron` + `net.http_post`, or a scheduled Edge Function).
- `update bookings set status='expired' where status='pending' and hold_expires_at < now()`.
- Frees up availability automatically for abandoned checkouts.

**Definition of Done:** A full booking — select dates → fill guest details → pay via Razorpay test mode → booking flips to `confirmed`/`paid` and consumes availability. Abandoning checkout leaves a `pending` booking that expires within ~15–25 minutes and availability is restored. Webhook tested via Razorpay's test webhook tool.

---

### Phase 7 — Admin Bookings Dashboard
**Goal:** Admin can see, filter, and manually manage bookings.

- [ ] Build `BookingsPage.tsx`:
  - Table of bookings: guest name, dates, room type, status, payment status, amount, created date — using the existing `Table` primitives.
  - Filters: status, date range, room type.
  - Detail view/modal per booking (guest contact info, payment IDs).
  - Manual actions: cancel a booking (frees availability — set `status='cancelled'`), mark a `manual`/offline booking as paid, add a walk-in booking directly (insert with `source='manual'`, `payment_status='paid'`, no Razorpay involved).
- [ ] Build `DashboardPage.tsx` (Phase 3 placeholder → real now):
  - Summary cards: today's check-ins/check-outs, occupancy %, upcoming bookings, revenue (this week/month) — same card styling as `RoomTypesPage`.

**Definition of Done:** Admin can view all bookings, cancel one and see availability free up on the public form, and add a manual booking that correctly reduces availability.

---

### Phase 8 — Polish, Edge Cases, Deployment
- [ ] Handle timezone consistency — store/compare dates as `date` (no time component) throughout; confirm check-in/check-out date pickers send `YYYY-MM-DD`.
- [ ] Add loading/error states to all admin pages and the booking flow, matching existing skeleton/spinner patterns if any exist.
- [ ] Confirm RLS by testing as an anonymous user via `curl`/Postman: public can read active room types & blocks, **cannot** read/write `bookings`, cannot write `room_types`.
- [ ] Set Vercel environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`).
- [ ] Set Supabase Edge Function secrets (`SUPABASE_SERVICE_ROLE_KEY` is available by default inside functions; add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
- [ ] Deploy edge functions: `supabase functions deploy create-booking-order verify-payment razorpay-webhook expire-pending-bookings`.
- [ ] Switch Razorpay from test to live keys only after a full successful test-mode run-through.
- [ ] Smoke test on production: one real booking flow + one admin CRUD flow.

---

## 4. Conflict-Avoidance Checklist (apply throughout)

- Before creating a component, `grep`/search for similarly-named or similarly-purposed existing components.
- Never rename or move existing public-facing files unless a phase explicitly calls for it.
- All new routes are additive (`/admin/...`); no changes to existing public route paths.
- All new DB objects are additive migrations; never edit an applied migration — write a new one (e.g., `0004_add_x.sql`).
- Keep a single shared Tailwind/theme config — admin pages import from it, never duplicate or override globally.
- Run the existing build/lint/test commands after each phase before opening a PR.
- Each PR description should reference which phase it implements and tick off that phase's Definition of Done.

---

## 5. Environment Variables Reference

**Frontend (Vercel project settings, `VITE_`-prefixed):**
| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings (anon/public key) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay dashboard (public key, test then live) |

**Supabase Edge Function secrets** (`supabase secrets set ...`):
| Variable | Source |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard — **never** exposed to frontend |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook config |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-available inside Supabase Edge Functions |

---

## 6. Prompting Notes for the AI Agent

When kicking off each phase with Antigravity, give it:
1. This file (or the relevant phase section).
2. The current `DESIGN_TOKENS.md` (after Phase 1).
3. An explicit instruction: *"Read the audit notes and reuse existing components/tokens — do not introduce new colors, spacing values, or component patterns."*
4. A reminder of the Definition of Done for that phase, so it knows when to stop.

Tackle one checklist item at a time and ask for a review/diff before moving to the next — especially for Phase 6, where correctness around payment verification and availability holds matters most.
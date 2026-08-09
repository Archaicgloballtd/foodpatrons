-- Foodpatrons MVP schema: roles, offers, reservations, coupon claims, staff.
-- Safe to run once. Uses "if not exists" / "or replace" / "drop policy if exists"
-- so re-running after a partial failure won't blow up on duplicate objects.

-- ============================================================
-- profiles (extends auth.users with a role)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- restaurant_staff (which users work at which restaurant)
-- Created before the helper functions below, since is_staff_of()
-- references this table — LANGUAGE SQL functions are validated
-- against the catalog at CREATE FUNCTION time, so the table must
-- already exist.
-- ============================================================
create table if not exists public.restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

alter table public.restaurant_staff enable row level security;

-- ============================================================
-- Helper functions (security definer so they can read profiles /
-- restaurant_staff without triggering RLS recursion on those tables).
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_of(target_restaurant_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.restaurant_staff
      where restaurant_id = target_restaurant_id and user_id = auth.uid()
    )
    or public.is_admin();
$$;

-- Now that the helper functions exist, add restaurant_staff's policies.
drop policy if exists "Staff can view their own assignments" on public.restaurant_staff;
create policy "Staff can view their own assignments"
  on public.restaurant_staff for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage staff assignments" on public.restaurant_staff;
create policy "Admins can manage staff assignments"
  on public.restaurant_staff for insert
  with check (public.is_admin());

drop policy if exists "Admins can remove staff assignments" on public.restaurant_staff;
create policy "Admins can remove staff assignments"
  on public.restaurant_staff for delete
  using (public.is_admin());

-- ============================================================
-- restaurants: extend the existing table with MVP fields
-- ============================================================
alter table public.restaurants
  add column if not exists image_url text,
  add column if not exists is_approved boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_open boolean not null default true;

drop policy if exists "Public restaurants are viewable by everyone" on public.restaurants;
drop policy if exists "Approved restaurants are viewable by everyone" on public.restaurants;
create policy "Approved restaurants are viewable by everyone"
  on public.restaurants for select
  using (is_approved = true or public.is_admin() or public.is_staff_of(id));

drop policy if exists "Admins can insert restaurants" on public.restaurants;
create policy "Admins can insert restaurants"
  on public.restaurants for insert
  with check (public.is_admin());

drop policy if exists "Admins and staff can update their restaurant" on public.restaurants;
create policy "Admins and staff can update their restaurant"
  on public.restaurants for update
  using (public.is_admin() or public.is_staff_of(id));

-- ============================================================
-- offers
-- ============================================================
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  discount_percent int check (discount_percent between 1 and 100),
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists offers_restaurant_id_idx on public.offers (restaurant_id);

alter table public.offers enable row level security;

drop policy if exists "Active offers on approved restaurants are viewable by everyone" on public.offers;
create policy "Active offers on approved restaurants are viewable by everyone"
  on public.offers for select
  using (
    (
      is_active = true
      and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_id and r.is_approved = true
      )
    )
    or public.is_admin()
    or public.is_staff_of(restaurant_id)
  );

drop policy if exists "Staff and admins can create offers" on public.offers;
create policy "Staff and admins can create offers"
  on public.offers for insert
  with check (public.is_admin() or public.is_staff_of(restaurant_id));

drop policy if exists "Staff and admins can update offers" on public.offers;
create policy "Staff and admins can update offers"
  on public.offers for update
  using (public.is_admin() or public.is_staff_of(restaurant_id));

drop policy if exists "Staff and admins can delete offers" on public.offers;
create policy "Staff and admins can delete offers"
  on public.offers for delete
  using (public.is_admin() or public.is_staff_of(restaurant_id));

-- ============================================================
-- reservations
-- No login required to book: anyone can INSERT. Nobody can browse
-- other people's reservations — only staff/admin of that restaurant
-- can SELECT. The confirmation screen is built from the data the
-- browser already has (what it just submitted), not read back from
-- the database, so no public SELECT policy is needed.
-- ============================================================
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  party_size int not null check (party_size > 0),
  reservation_date date not null,
  reservation_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_restaurant_id_idx on public.reservations (restaurant_id, status);

alter table public.reservations enable row level security;

drop policy if exists "Anyone can create a reservation" on public.reservations;
create policy "Anyone can create a reservation"
  on public.reservations for insert
  with check (true);

drop policy if exists "Staff and admins can view reservations for their restaurant" on public.reservations;
create policy "Staff and admins can view reservations for their restaurant"
  on public.reservations for select
  using (public.is_admin() or public.is_staff_of(restaurant_id));

drop policy if exists "Staff and admins can update reservations for their restaurant" on public.reservations;
create policy "Staff and admins can update reservations for their restaurant"
  on public.reservations for update
  using (public.is_admin() or public.is_staff_of(restaurant_id));

-- ============================================================
-- coupon_claims
-- Same privacy pattern as reservations: public INSERT, staff/admin-only SELECT.
-- ============================================================
create table if not exists public.coupon_claims (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null unique,
  customer_phone text not null,
  status text not null default 'unused' check (status in ('unused', 'used', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists coupon_claims_restaurant_id_idx on public.coupon_claims (restaurant_id, status);

alter table public.coupon_claims enable row level security;

drop policy if exists "Anyone can claim an offer" on public.coupon_claims;
create policy "Anyone can claim an offer"
  on public.coupon_claims for insert
  with check (true);

drop policy if exists "Staff and admins can view coupon claims for their restaurant" on public.coupon_claims;
create policy "Staff and admins can view coupon claims for their restaurant"
  on public.coupon_claims for select
  using (public.is_admin() or public.is_staff_of(restaurant_id));

drop policy if exists "Staff and admins can update coupon claims for their restaurant" on public.coupon_claims;
create policy "Staff and admins can update coupon claims for their restaurant"
  on public.coupon_claims for update
  using (public.is_admin() or public.is_staff_of(restaurant_id));

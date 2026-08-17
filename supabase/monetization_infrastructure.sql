-- ============================================================
-- Ads marketplace: restaurants can self-serve request a paid ad slot
-- instead of only admin-created ads. Payment collection is manual for now
-- (no bKash/Nagad/Stripe merchant integration yet) — a request lands as
-- payment_status='pending_review', inactive, and an admin flips it to
-- 'paid' + active once payment is confirmed out of band.
-- ============================================================
alter table public.ads add column if not exists restaurant_id uuid references public.restaurants(id) on delete set null;
alter table public.ads add column if not exists price_amount numeric;
alter table public.ads add column if not exists currency text not null default 'BDT';
alter table public.ads add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'pending_review', 'paid'));
alter table public.ads add column if not exists requested_by uuid references auth.users(id) on delete set null;
alter table public.ads add column if not exists requested_at timestamptz;

drop policy if exists "Staff can request an ad for their restaurant" on public.ads;
create policy "Staff can request an ad for their restaurant"
  on public.ads for insert
  with check (
    payment_status = 'pending_review'
    and active = false
    and requested_by = auth.uid()
    and restaurant_id is not null
    and public.is_staff_of(restaurant_id)
  );

drop policy if exists "Staff can view their own ad requests" on public.ads;
create policy "Staff can view their own ad requests"
  on public.ads for select
  using (restaurant_id is not null and public.is_staff_of(restaurant_id));

-- ============================================================
-- Ad performance tracking (impressions/clicks), so a paying restaurant can
-- eventually be shown real numbers instead of just "your ad is live".
-- ============================================================
create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  created_at timestamptz not null default now()
);

create index if not exists ad_events_ad_id_idx on public.ad_events (ad_id, event_type);

alter table public.ad_events enable row level security;

-- Writes only via the service-role /api/track-ad route (anonymous visitors
-- have no auth.uid() for a policy to check against).
drop policy if exists "Staff and admin can view their ad events" on public.ad_events;
create policy "Staff and admin can view their ad events"
  on public.ad_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.ads
      where ads.id = ad_events.ad_id
      and ads.restaurant_id is not null
      and public.is_staff_of(ads.restaurant_id)
    )
  );

-- ============================================================
-- Reservation commission ledger. There's no order/bill-total tracked
-- anywhere in the app, so a percentage-of-bill commission has nothing to
-- apply against — commission_per_reservation is a flat BDT fee instead
-- (the same model OpenTable-style platforms use: per-cover/per-reservation,
-- not per-bill). It's opt-in per restaurant (null = no commission agreed),
-- and a ledger row is only ever created when a restaurant marks a
-- reservation "fulfilled" — never on a mere booking or a no-show, so
-- nothing is owed for a table that never happened.
-- ============================================================
alter table public.restaurants add column if not exists commission_per_reservation numeric;

alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'fulfilled', 'no_show'));

create table if not exists public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade unique,
  amount numeric not null,
  status text not null default 'owed' check (status in ('owed', 'paid')),
  created_at timestamptz not null default now()
);

create index if not exists commission_ledger_restaurant_id_idx on public.commission_ledger (restaurant_id, status);

alter table public.commission_ledger enable row level security;

drop policy if exists "Admin can manage commission ledger" on public.commission_ledger;
create policy "Admin can manage commission ledger"
  on public.commission_ledger for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Staff can view their own commission ledger" on public.commission_ledger;
create policy "Staff can view their own commission ledger"
  on public.commission_ledger for select
  using (public.is_staff_of(restaurant_id));

-- ============================================================
-- Lightweight referral program: every profile gets a shareable code, and
-- we record who referred a new signup (set once at signup, never changed).
-- ============================================================
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;

update public.profiles set referral_code = substr(replace(id::text, '-', ''), 1, 8)
where referral_code is null;

-- Redefine handle_new_user (see mvp_schema.sql / _pending_migrations_2026-08-09b.sql
-- for prior versions) to also assign a referral_code and resolve an optional
-- referred_by_code passed in signup metadata to the referring profile's id.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    substr(replace(new.id::text, '-', ''), 1, 8),
    (select id from public.profiles where referral_code = new.raw_user_meta_data->>'referred_by_code')
  );
  return new;
end;
$$;

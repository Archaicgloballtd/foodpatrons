-- Extends the MVP schema with: richer restaurant profile fields, an ads
-- system, and offer label/terms fields. Additive only — existing columns
-- (address, image_url, is_approved, discount_percent, is_active, etc.) are
-- kept as-is since working UI already depends on them. New columns are
-- synced from the admin Server Actions rather than replacing the old ones.

-- ============================================================
-- restaurants: additional profile fields
-- ============================================================
alter table public.restaurants
  add column if not exists slug text unique,
  add column if not exists description text,
  add column if not exists area text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists opening_hours text,
  add column if not exists price_range text,
  add column if not exists cover_image_url text,
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected'));

-- Backfill slug + area for existing rows so nothing is left null.
update public.restaurants
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
  || '-' || substr(id::text, 1, 6)
where slug is null;

update public.restaurants
set area = split_part(address, ',', 1)
where area is null and address is not null;

update public.restaurants
set status = case when is_approved then 'approved' else 'pending' end;

-- ============================================================
-- offers: label/terms fields (alongside existing discount_percent/is_active)
-- ============================================================
alter table public.offers
  add column if not exists discount_label text,
  add column if not exists terms text;

-- ============================================================
-- ads
-- ============================================================
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  link_url text,
  slot text not null check (
    slot in ('home_popup', 'home_banner', 'sidebar', 'explore_top', 'restaurant_card', 'footer')
  ),
  active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists ads_slot_idx on public.ads (slot, active);

alter table public.ads enable row level security;

-- Public can read active ads within their date window. Writes happen only
-- through admin Server Actions using the service role key (which bypasses
-- RLS entirely), so no insert/update/delete policy is defined here.
drop policy if exists "Active ads are viewable by everyone" on public.ads;
create policy "Active ads are viewable by everyone"
  on public.ads for select
  using (
    active = true
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

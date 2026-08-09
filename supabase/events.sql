-- Food & dining events around Dhaka. There's no reliable automated feed for
-- this (Facebook's Events API requires app review/business verification we
-- don't have, and scraping Facebook directly isn't something we do) — so
-- this is admin/staff-curated: an admin can post any event, and restaurant
-- staff can post events for their own restaurant, same trust model as offers.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  area text,
  venue_name text,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  image_url text,
  source_url text,
  source_label text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists events_date_idx on public.events (event_date);
create index if not exists events_restaurant_idx on public.events (restaurant_id);

alter table public.events enable row level security;

drop policy if exists "Anyone can view events" on public.events;
create policy "Anyone can view events"
  on public.events for select
  using (true);

drop policy if exists "Admins and restaurant staff can post events" on public.events;
create policy "Admins and restaurant staff can post events"
  on public.events for insert
  with check (public.is_admin() or (restaurant_id is not null and public.is_staff_of(restaurant_id)));

drop policy if exists "Admins and restaurant staff can update events" on public.events;
create policy "Admins and restaurant staff can update events"
  on public.events for update
  using (public.is_admin() or (restaurant_id is not null and public.is_staff_of(restaurant_id)));

drop policy if exists "Admins and restaurant staff can delete events" on public.events;
create policy "Admins and restaurant staff can delete events"
  on public.events for delete
  using (public.is_admin() or (restaurant_id is not null and public.is_staff_of(restaurant_id)));

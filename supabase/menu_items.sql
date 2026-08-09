-- Real, restaurant-entered menu items. Nothing here is ever auto-generated —
-- a restaurant only shows a menu once its own staff (or an admin) adds one.
-- Public visitors can only read; only the linked restaurant's staff can write.

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  category text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_restaurant_id_idx on public.menu_items (restaurant_id, category, created_at);

alter table public.menu_items enable row level security;

drop policy if exists "Anyone can view menu items" on public.menu_items;
create policy "Anyone can view menu items"
  on public.menu_items for select
  using (true);

drop policy if exists "Staff can manage their restaurant's menu" on public.menu_items;
create policy "Staff can manage their restaurant's menu"
  on public.menu_items for all
  using (public.is_admin() or public.is_staff_of(restaurant_id))
  with check (public.is_admin() or public.is_staff_of(restaurant_id));

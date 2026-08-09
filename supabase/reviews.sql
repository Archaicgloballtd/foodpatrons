-- Customer ratings + comments per restaurant. Posting stays as low-friction
-- as reservations/offer claims (no account needed — just a name). Deletion
-- is deliberately admin-only: not even the restaurant's own staff can
-- remove a review, so an owner can't quietly delete bad feedback.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_id_idx on public.reviews (restaurant_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Anyone can post a review" on public.reviews;
create policy "Anyone can post a review"
  on public.reviews for insert
  with check (true);

drop policy if exists "Only admins can delete reviews" on public.reviews;
create policy "Only admins can delete reviews"
  on public.reviews for delete
  using (public.is_admin());

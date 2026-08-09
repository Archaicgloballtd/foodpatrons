-- Combined: recreate the missing `reviews` table (with owner-reply support
-- built in from the start), plus menu_items and blog_posts. Safe to run all
-- at once — every statement uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF
-- EXISTS so re-running this later won't break anything.

-- ── reviews ──────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  owner_reply text,
  owner_reply_at timestamptz,
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

drop policy if exists "Staff can reply to their restaurant's reviews" on public.reviews;
create policy "Staff can reply to their restaurant's reviews"
  on public.reviews for update
  using (public.is_admin() or public.is_staff_of(restaurant_id))
  with check (public.is_admin() or public.is_staff_of(restaurant_id));

-- ── menu_items ───────────────────────────────────────────────────────────
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

-- ── blog_posts ───────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  social_caption text,
  city text,
  category text,
  restaurant_ids uuid[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (is_published, published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can view published posts" on public.blog_posts;
create policy "Anyone can view published posts"
  on public.blog_posts for select
  using (is_published = true or public.is_admin());

drop policy if exists "Admins can manage posts" on public.blog_posts;
create policy "Admins can manage posts"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

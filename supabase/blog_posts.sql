-- SEO/growth content: area & cuisine guides generated from real restaurant
-- data already in the `restaurants` table (never invented specifics about a
-- place — only facts already stored: name, area, cuisine, price, rating).
-- Drafts (is_published = false) are reviewed by an admin before going live.

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

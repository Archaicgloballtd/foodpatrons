-- Twitter-style community feed: topics, posts, likes, comments.
-- Anyone can read; posting/commenting/liking requires an account (author_id
-- must match auth.uid()). Deletion follows the same pattern as reviews —
-- the author can remove their own post/comment, and admins can remove any.

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0
);

-- author_id references public.profiles (not auth.users directly) so
-- PostgREST can embed the author's name in a single query. Every auth user
-- gets a profiles row automatically via the on_auth_user_created trigger,
-- so this is a 1:1 relationship in practice.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  like_count int not null default 0,
  comment_count int not null default 0
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists posts_topic_created_idx on public.posts (topic_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
create index if not exists post_likes_post_idx on public.post_likes (post_id);

alter table public.topics enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Anyone can view topics" on public.topics;
create policy "Anyone can view topics"
  on public.topics for select
  using (true);

drop policy if exists "Admins manage topics" on public.topics;
create policy "Admins manage topics"
  on public.topics for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Anyone can view posts" on public.posts;
create policy "Anyone can view posts"
  on public.posts for select
  using (true);

drop policy if exists "Signed-in users can post" on public.posts;
create policy "Signed-in users can post"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors and admins can delete posts" on public.posts;
create policy "Authors and admins can delete posts"
  on public.posts for delete
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "Anyone can view likes" on public.post_likes;
create policy "Anyone can view likes"
  on public.post_likes for select
  using (true);

drop policy if exists "Signed-in users can like" on public.post_likes;
create policy "Signed-in users can like"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own like" on public.post_likes;
create policy "Users can unlike their own like"
  on public.post_likes for delete
  using (user_id = auth.uid());

drop policy if exists "Anyone can view comments" on public.comments;
create policy "Anyone can view comments"
  on public.comments for select
  using (true);

drop policy if exists "Signed-in users can comment" on public.comments;
create policy "Signed-in users can comment"
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors and admins can delete comments" on public.comments;
create policy "Authors and admins can delete comments"
  on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());

-- Keep posts.like_count / comment_count in sync so the feed can read them
-- directly instead of running a count() per post on every render.
create or replace function public.bump_post_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$;

drop trigger if exists on_post_like_change on public.post_likes;
create trigger on_post_like_change
after insert or delete on public.post_likes
for each row execute function public.bump_post_like_count();

create or replace function public.bump_post_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  else
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$;

drop trigger if exists on_post_comment_change on public.comments;
create trigger on_post_comment_change
after insert or delete on public.comments
for each row execute function public.bump_post_comment_count();

insert into public.topics (slug, name, description, sort_order) values
  ('general', 'General', 'Anything food or Dhaka related', 0),
  ('reviews', 'Food Reviews', 'Share how a place treated you', 1),
  ('events', 'Events & Meetups', 'Pop-ups, tastings, food crawls', 2),
  ('deals', 'Deals & Offers', 'Spotted a good deal? Post it here', 3),
  ('news', 'Restaurant News', 'Openings, closings, menu changes', 4)
on conflict (slug) do nothing;

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception
  when duplicate_object then null;
end $$;

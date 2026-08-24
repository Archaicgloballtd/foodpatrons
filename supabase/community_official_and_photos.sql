-- Lets a post optionally tag a real restaurant — the restaurant's own real
-- cover photo then displays on the post. Never an arbitrary/unverified
-- image upload, always tied to a restaurant already vetted in the catalog.
alter table public.posts add column if not exists restaurant_id uuid references public.restaurants(id) on delete set null;

-- Official platform account flag, so its posts render with a clear
-- "foodpatrons" badge instead of looking like an anonymous individual user.
-- Only ever true for the one account scripts/agent-community.js posts as.
alter table public.profiles add column if not exists is_official boolean not null default false;

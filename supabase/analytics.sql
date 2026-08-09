-- Background visit analytics: session length, time of access, pages viewed.
-- Writes only ever go through /api/track using the service-role key — there
-- is deliberately no public insert/update policy, since anonymous visitors
-- have no auth.uid() for RLS to check against. Reads are admin-only, so this
-- behavioral data (which may inform advertiser reporting) never leaks to
-- other users through the client.

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_seconds int not null default 0,
  entry_path text,
  referrer text,
  user_agent text
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_sessions_last_seen_idx on public.analytics_sessions (last_seen_at desc);
create index if not exists analytics_sessions_user_idx on public.analytics_sessions (user_id);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Admins can view analytics sessions" on public.analytics_sessions;
create policy "Admins can view analytics sessions"
  on public.analytics_sessions for select
  using (public.is_admin());

drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
  on public.analytics_events for select
  using (public.is_admin());

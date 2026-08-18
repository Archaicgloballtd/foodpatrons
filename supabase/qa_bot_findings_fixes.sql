-- Fixes for real bugs the QA bot agent (scripts/agent-qa.js) found on its
-- first live run: three features that were built and shipped in the code
-- but never actually had their migrations run, so they've been silently
-- broken in production (failing gracefully in the UI, but genuinely not
-- working) until now.

-- 1. Reservations: ReservationModal.tsx inserts user_id to link a booking
-- to the signed-in account, but the column never existed — every single
-- reservation attempt has been failing with a real error shown to the user.
-- This is the most serious of the four; it breaks the core "reserve a
-- table" flow for everyone, not just the bot.
alter table public.reservations add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2. Membership points: the whole points/tier UI on the profile page reads
-- profiles.points, which never got added — points always silently read 0.
alter table public.profiles add column if not exists points integer not null default 0;

-- 3. Notifications bell (src/components/NotificationBell.tsx): built and
-- wired up, but the table was never created, so it's been failing
-- gracefully (shows "Nothing yet") without anyone knowing it's broken.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No insert policy: notifications are only ever created server-side
-- (service role), same pattern as analytics_events/ad_events.

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- QA bot account flag (see scripts/agent-qa.js) — tags synthetic test
-- accounts so they're never confused with real users in admin views.
alter table public.profiles add column if not exists is_test_account boolean not null default false;

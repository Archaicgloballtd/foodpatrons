-- Lets someone sign up specifically as "I run a restaurant" instead of a
-- plain customer. Signing up never grants staff access by itself — it just
-- files an application. An admin reviews it and, on approval, links the
-- applicant to a restaurant (new or existing) and promotes their role.

create table if not exists public.restaurant_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_name text not null,
  contact_phone text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists restaurant_applications_status_idx on public.restaurant_applications (status);

alter table public.restaurant_applications enable row level security;

drop policy if exists "Users can create their own application" on public.restaurant_applications;
create policy "Users can create their own application"
  on public.restaurant_applications for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can view their own application, admins view all" on public.restaurant_applications;
create policy "Users can view their own application, admins view all"
  on public.restaurant_applications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can review applications" on public.restaurant_applications;
create policy "Admins can review applications"
  on public.restaurant_applications for update
  using (public.is_admin());

-- Admins need to promote an approved applicant's role, which means
-- updating a profiles row that isn't their own. The existing policy only
-- allowed users to update themselves.
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- So the admin dashboard can show new applications live without a refresh.
do $$
begin
  alter publication supabase_realtime add table public.restaurant_applications;
exception
  when duplicate_object then null;
end $$;

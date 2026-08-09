-- Agent Sales: drafted outreach messages inviting real, unclaimed restaurants
-- to claim their free listing. Nothing is ever sent automatically — an admin
-- reviews each draft, copies it, and sends it themselves through whatever
-- channel they find for that restaurant (call, WhatsApp, Facebook page, etc).

create table if not exists public.outreach_queue (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'claimed', 'dismissed')),
  created_at timestamptz not null default now()
);

create unique index if not exists outreach_queue_restaurant_id_idx on public.outreach_queue (restaurant_id);

alter table public.outreach_queue enable row level security;

drop policy if exists "Admins can manage outreach queue" on public.outreach_queue;
create policy "Admins can manage outreach queue"
  on public.outreach_queue for all
  using (public.is_admin())
  with check (public.is_admin());

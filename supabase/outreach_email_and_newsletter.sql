-- Track real email sends for Agent Sales outreach (distinct from the manual
-- "mark contacted" status, which also covers phone/WhatsApp/in-person outreach).
alter table public.outreach_queue add column if not exists emailed_at timestamptz;
alter table public.outreach_queue add column if not exists email_error text;

-- Newsletter subscribers, captured only via the public opt-in form on the
-- site footer (real people submitting their own email — never imported).
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists "admin can view subscribers" on public.newsletter_subscribers;
create policy "admin can view subscribers" on public.newsletter_subscribers
  for select using (public.is_admin());

drop policy if exists "admin can update subscribers" on public.newsletter_subscribers;
create policy "admin can update subscribers" on public.newsletter_subscribers
  for update using (public.is_admin());

-- Send history so the admin panel can show what's already gone out, and so
-- nobody accidentally re-sends the same campaign twice.
create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  recipient_count int not null default 0,
  sent_at timestamptz not null default now()
);
alter table public.newsletter_campaigns enable row level security;

drop policy if exists "admin can view campaigns" on public.newsletter_campaigns;
create policy "admin can view campaigns" on public.newsletter_campaigns
  for select using (public.is_admin());

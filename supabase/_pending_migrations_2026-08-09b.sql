-- The last 4 long-pending migrations, bundled into one run. These were
-- written earlier this project but never actually applied — their absence
-- is currently causing real console errors on every logged-in page load
-- (the notification bell queries a table that doesn't exist) and silently
-- disables the points/tags/user-management features their code already
-- expects. Safe to run all at once — everything uses IF NOT EXISTS / OR
-- REPLACE / DROP ... IF EXISTS, so re-running later won't break anything.

-- ── restaurant tags (rooftop/buffet filters) ────────────────────────────
alter table public.restaurants
  add column if not exists tags text[] not null default '{}';

create index if not exists restaurants_tags_idx on public.restaurants using gin (tags);

update public.restaurants set tags = array['rooftop'] where name = 'Cielo Rooftop' and area = 'Banani';
update public.restaurants set tags = array['buffet'] where name = 'Savor' and area = 'Banani';
update public.restaurants set tags = array['buffet'] where name = 'Flambé Restaurant' and area = 'Gulshan';
update public.restaurants set tags = array['rooftop'] where name = 'Adda Multi Cuisine Restaurant' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Koolcha' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Yenzo' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Bread & Beyond (Dhanmondi)' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'Royal Buffet Restaurant' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'Buffet Lounge (Dhanmondi)' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'The Buffet Stories' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'White Hall Buffet Restaurant' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'The Cafe Rio' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'The White Hall Buffet & Restaurant (Uttara)' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Sector 7 Restaurant & Party Center' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Royal Cuisine Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Terra Bistro (Uttara)' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Chao Town' and area = 'Uttara';
update public.restaurants set tags = array['rooftop', 'buffet'] where name = 'Tarragon Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['rooftop', 'buffet'] where name = 'Mughal Aroma Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Ratatouille Restaurant & Lounge' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Pavilion Restaurant & Cafe' and area = 'Uttara';
update public.restaurants set tags = array['rooftop'] where name = 'Cafe Rain' and area = 'Uttara';

-- ── admin user management (profiles.email + admin can list all users) ──
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- ── membership points ────────────────────────────────────────────────
alter table public.profiles add column if not exists points integer not null default 0;

create or replace function public.award_reservation_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.user_id is not null then
    update public.profiles set points = points + 10 where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_reservation_award_points on public.reservations;
create trigger on_reservation_award_points
after insert on public.reservations
for each row execute function public.award_reservation_points();

create or replace function public.award_claim_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.user_id is not null then
    update public.profiles set points = points + 15 where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_claim_award_points on public.coupon_claims;
create trigger on_claim_award_points
after insert on public.coupon_claims
for each row execute function public.award_claim_points();

create or replace function public.award_post_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set points = points + 5 where id = new.author_id;
  return new;
end;
$$;

drop trigger if exists on_post_award_points on public.posts;
create trigger on_post_award_points
after insert on public.posts
for each row execute function public.award_post_points();

-- ── notifications (fixes the notification bell errors) ─────────────────
alter table public.reservations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.coupon_claims add column if not exists user_id uuid references auth.users(id) on delete set null;

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

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

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

create or replace function public.notify_new_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_post_author uuid;
begin
  select author_id into v_post_author from public.posts where id = new.post_id;
  if v_post_author is not null and v_post_author != new.author_id then
    insert into public.notifications (user_id, type, title, body, link)
    values (v_post_author, 'comment', 'New comment on your post', left(new.content, 120), '/community');
  end if;
  return new;
end;
$$;

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
after insert on public.comments
for each row execute function public.notify_new_comment();

create or replace function public.notify_reservation_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_restaurant_name text;
begin
  if new.user_id is not null and new.status is distinct from old.status and new.status in ('confirmed', 'cancelled') then
    select name into v_restaurant_name from public.restaurants where id = new.restaurant_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'reservation_status',
      case when new.status = 'confirmed' then 'Reservation confirmed' else 'Reservation cancelled' end,
      coalesce(v_restaurant_name, 'The restaurant') || ' — ' || new.reservation_date || ' at ' || new.reservation_time,
      '/bookings'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_reservation_status_notify on public.reservations;
create trigger on_reservation_status_notify
after update on public.reservations
for each row execute function public.notify_reservation_status();

create or replace function public.notify_new_reservation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_staff record;
begin
  for v_staff in select user_id from public.restaurant_staff where restaurant_id = new.restaurant_id loop
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_staff.user_id,
      'new_reservation',
      'New reservation request',
      new.customer_name || ' — ' || new.party_size || ' people, ' || new.reservation_date || ' at ' || new.reservation_time,
      '/dashboard'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_new_reservation_notify on public.reservations;
create trigger on_new_reservation_notify
after insert on public.reservations
for each row execute function public.notify_new_reservation();

create or replace function public.notify_new_claim()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_staff record;
begin
  for v_staff in select user_id from public.restaurant_staff where restaurant_id = new.restaurant_id loop
    insert into public.notifications (user_id, type, title, body, link)
    values (v_staff.user_id, 'new_claim', 'Offer claimed', 'A customer claimed an offer — code ' || new.code, '/dashboard');
  end loop;
  return new;
end;
$$;

drop trigger if exists on_new_claim_notify on public.coupon_claims;
create trigger on_new_claim_notify
after insert on public.coupon_claims
for each row execute function public.notify_new_claim();

create or replace function public.notify_application_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'application_status',
      case when new.status = 'approved' then 'Restaurant application approved' else 'Restaurant application update' end,
      case
        when new.status = 'approved' then 'You can now manage ' || new.restaurant_name || ' from your dashboard.'
        else coalesce(new.admin_note, 'Your application was not approved this time.')
      end,
      case when new.status = 'approved' then '/dashboard' else '/login' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_application_status_notify on public.restaurant_applications;
create trigger on_application_status_notify
after update on public.restaurant_applications
for each row execute function public.notify_application_status();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

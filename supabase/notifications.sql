-- In-app notifications, created entirely by security-definer triggers so
-- they fire consistently no matter which client/action caused the event.
-- Regular users can only read and mark-read their own rows — there's no
-- insert policy for them, since every row is written by a trigger.

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

-- ============================================================
-- 1. Someone commented on your community post
-- ============================================================
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

-- ============================================================
-- 2. Reservation confirmed or cancelled -> notify the customer
--    (only fires if they were signed in when they booked)
-- ============================================================
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

-- ============================================================
-- 3. New reservation request -> notify restaurant staff
-- ============================================================
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

-- ============================================================
-- 4. New offer claim -> notify restaurant staff
-- ============================================================
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

-- ============================================================
-- 5. Restaurant application approved/rejected -> notify the applicant
-- ============================================================
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

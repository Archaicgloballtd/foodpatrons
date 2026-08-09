-- Simple membership points: customers earn points for booking a table,
-- claiming an offer, or posting in the community — all actions that
-- already require an account, so there's no new signup friction. Points
-- live directly on profiles (not a separate ledger table) since this is a
-- lightweight perk, not an auditable currency.

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

-- Restaurant contact email, for Agent Sales' email outreach. Populated only
-- by real web research (Agent Data), never invented.
alter table public.restaurants add column if not exists email text;

-- updated_at, auto-maintained, so the daily agent report can tell which
-- restaurants Agent Data actually touched in the last day.
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_restaurants_touch_updated_at on public.restaurants;
create trigger on_restaurants_touch_updated_at
before update on public.restaurants
for each row execute function public.touch_updated_at();

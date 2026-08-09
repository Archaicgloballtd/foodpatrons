-- Restaurant contact email, for Agent Sales' email outreach. Populated only
-- by real web research (Agent Data), never invented.
alter table public.restaurants add column if not exists email text;

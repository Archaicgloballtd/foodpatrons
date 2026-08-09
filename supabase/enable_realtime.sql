-- Lets the staff dashboard receive live updates (new reservations, new
-- coupon claims) over Supabase Realtime instead of requiring a manual
-- refresh. Wrapped in exception handlers so it's safe to re-run.

do $$
begin
  alter publication supabase_realtime add table public.reservations;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.coupon_claims;
exception
  when duplicate_object then null;
end $$;

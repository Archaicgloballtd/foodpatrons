-- Admins can create/edit/deactivate ads (previously only handled via the
-- service-role key; now that /admin uses real Supabase Auth accounts, these
-- writes go through RLS like everything else).
drop policy if exists "Admins can create ads" on public.ads;
create policy "Admins can create ads"
  on public.ads for insert
  with check (public.is_admin());

drop policy if exists "Admins can update ads" on public.ads;
create policy "Admins can update ads"
  on public.ads for update
  using (public.is_admin());

drop policy if exists "Admins can delete ads" on public.ads;
create policy "Admins can delete ads"
  on public.ads for delete
  using (public.is_admin());

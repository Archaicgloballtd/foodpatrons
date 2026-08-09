-- Lets a restaurant's own staff post one official reply per review, shown
-- publicly under the customer's comment. Only the linked restaurant's staff
-- (or an admin) can write a reply — enforced via is_staff_of(), the same
-- helper already used for restaurant-profile edits.

alter table public.reviews
  add column if not exists owner_reply text,
  add column if not exists owner_reply_at timestamptz;

drop policy if exists "Staff can reply to their restaurant's reviews" on public.reviews;
create policy "Staff can reply to their restaurant's reviews"
  on public.reviews for update
  using (public.is_admin() or public.is_staff_of(restaurant_id))
  with check (public.is_admin() or public.is_staff_of(restaurant_id));

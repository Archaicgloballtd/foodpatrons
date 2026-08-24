-- Meetups ("parties"): a signed-in user proposes meeting other real diners
-- at a specific real restaurant and time; others join, then coordinate in a
-- small group chat scoped to that meetup. Deliberately tied to a real
-- restaurant_id rather than an arbitrary pin or address — keeps every
-- meetup anchored to a real, public venue rather than a private location.

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  scheduled_for timestamptz not null,
  max_members int check (max_members is null or max_members between 2 and 50),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists parties_restaurant_id_idx on public.parties (restaurant_id, status);
create index if not exists parties_scheduled_for_idx on public.parties (scheduled_for) where status = 'open';

create table if not exists public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

create table if not exists public.party_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists party_messages_party_id_idx on public.party_messages (party_id, created_at);

create or replace function public.is_party_member(target_party_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.party_members
    where party_id = target_party_id and user_id = auth.uid()
  );
$$;

alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_messages enable row level security;

-- parties: open discovery, like restaurants — anyone can browse what's
-- happening. Only the creator (or admin) can edit/close it.
drop policy if exists "Anyone can view parties" on public.parties;
create policy "Anyone can view parties"
  on public.parties for select
  using (true);

drop policy if exists "Signed-in users can create a party" on public.parties;
create policy "Signed-in users can create a party"
  on public.parties for insert
  with check (creator_id = auth.uid());

drop policy if exists "Creator or admin can update a party" on public.parties;
create policy "Creator or admin can update a party"
  on public.parties for update
  using (creator_id = auth.uid() or public.is_admin());

-- party_members: membership (and hence the avatar list) is public, so a
-- meetup card can show who's in before you join. Joining checks the party
-- is still open and, if it has a cap, that there's room left.
drop policy if exists "Anyone can view party members" on public.party_members;
create policy "Anyone can view party members"
  on public.party_members for select
  using (true);

drop policy if exists "Users can join an open party with room" on public.party_members;
create policy "Users can join an open party with room"
  on public.party_members for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.parties p where p.id = party_id and p.status = 'open')
    and (
      (select max_members from public.parties where id = party_id) is null
      or (select count(*) from public.party_members pm where pm.party_id = party_members.party_id)
         < (select max_members from public.parties where id = party_id)
    )
  );

drop policy if exists "Users can leave a party" on public.party_members;
create policy "Users can leave a party"
  on public.party_members for delete
  using (user_id = auth.uid() or public.is_admin());

-- party_messages: chat is private to the meetup's own members.
drop policy if exists "Members can view party messages" on public.party_messages;
create policy "Members can view party messages"
  on public.party_messages for select
  using (public.is_party_member(party_id));

drop policy if exists "Members can send party messages" on public.party_messages;
create policy "Members can send party messages"
  on public.party_messages for insert
  with check (sender_id = auth.uid() and public.is_party_member(party_id));

do $$
begin
  alter publication supabase_realtime add table public.party_messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.party_members;
exception
  when duplicate_object then null;
end $$;

-- Foodpatrons: restaurants table
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- Row Level Security: restaurants are public data, so anyone can read them.
-- No one can insert/update/delete from the client yet (we'll add that later
-- once there's an admin flow) — for now, rows are added manually via the
-- Supabase Table Editor.
alter table public.restaurants enable row level security;

create policy "Public restaurants are viewable by everyone"
  on public.restaurants
  for select
  using (true);

-- A few sample rows (Dhaka, Bangladesh) so the homepage has real data to fetch.
insert into public.restaurants (name, cuisine, rating, address, latitude, longitude)
values
  ('Sunset Grill', 'American', 4.5, 'Gulshan 1, Dhaka', 23.7925, 90.4078),
  ('Ramen House', 'Japanese', 4.7, 'Banani, Dhaka', 23.7936, 90.4066),
  ('La Piazza', 'Italian', 4.3, 'Dhanmondi, Dhaka', 23.7461, 90.3742),
  ('Spice Route', 'Indian', 4.6, 'Bashundhara, Dhaka', 23.8151, 90.4256),
  ('Taco Fresco', 'Mexican', 4.2, 'Uttara, Dhaka', 23.8759, 90.3795),
  ('Green Bowl', 'Vegan', 4.8, 'Mirpur, Dhaka', 23.8223, 90.3654);

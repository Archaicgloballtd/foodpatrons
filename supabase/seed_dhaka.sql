-- Replace sample restaurant data with Dhaka, Bangladesh locations.
truncate table public.restaurants;

insert into public.restaurants (name, cuisine, rating, address, latitude, longitude)
values
  ('Sunset Grill', 'American', 4.5, 'Gulshan 1, Dhaka', 23.7925, 90.4078),
  ('Ramen House', 'Japanese', 4.7, 'Banani, Dhaka', 23.7936, 90.4066),
  ('La Piazza', 'Italian', 4.3, 'Dhanmondi, Dhaka', 23.7461, 90.3742),
  ('Spice Route', 'Indian', 4.6, 'Bashundhara, Dhaka', 23.8151, 90.4256),
  ('Taco Fresco', 'Mexican', 4.2, 'Uttara, Dhaka', 23.8759, 90.3795),
  ('Green Bowl', 'Vegan', 4.8, 'Mirpur, Dhaka', 23.8223, 90.3654);

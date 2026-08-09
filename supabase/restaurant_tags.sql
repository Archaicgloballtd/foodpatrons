-- Free-form tags for filtering (rooftop, buffet, etc.) that don't belong in
-- the cuisine field. Populated from sourced research, not guessed from names.

alter table public.restaurants
  add column if not exists tags text[] not null default '{}';

create index if not exists restaurants_tags_idx on public.restaurants using gin (tags);

-- Tag assignments sourced from research (not guessed). Matched by exact
-- name + area to avoid collisions with similarly-named restaurants in
-- other areas (e.g. "Sultan's Dine" exists in both Dhanmondi and Uttara).

update public.restaurants set tags = array['rooftop'] where name = 'Cielo Rooftop' and area = 'Banani';
update public.restaurants set tags = array['buffet'] where name = 'Savor' and area = 'Banani';
update public.restaurants set tags = array['buffet'] where name = 'Flambé Restaurant' and area = 'Gulshan';

update public.restaurants set tags = array['rooftop'] where name = 'Adda Multi Cuisine Restaurant' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Koolcha' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Yenzo' and area = 'Dhanmondi';
update public.restaurants set tags = array['rooftop'] where name = 'Bread & Beyond (Dhanmondi)' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'Royal Buffet Restaurant' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'Buffet Lounge (Dhanmondi)' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'The Buffet Stories' and area = 'Dhanmondi';
update public.restaurants set tags = array['buffet'] where name = 'White Hall Buffet Restaurant' and area = 'Dhanmondi';

update public.restaurants set tags = array['buffet'] where name = 'The Cafe Rio' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'The White Hall Buffet & Restaurant (Uttara)' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Sector 7 Restaurant & Party Center' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Royal Cuisine Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Terra Bistro (Uttara)' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Chao Town' and area = 'Uttara';
update public.restaurants set tags = array['rooftop', 'buffet'] where name = 'Tarragon Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['rooftop', 'buffet'] where name = 'Mughal Aroma Restaurant' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Ratatouille Restaurant & Lounge' and area = 'Uttara';
update public.restaurants set tags = array['buffet'] where name = 'Pavilion Restaurant & Cafe' and area = 'Uttara';
update public.restaurants set tags = array['rooftop'] where name = 'Cafe Rain' and area = 'Uttara';

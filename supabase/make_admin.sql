-- Run this AFTER you've signed up once through /login (Sign up tab).
-- Replace the email with the one you signed up with.
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');

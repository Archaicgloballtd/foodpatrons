# Foodpatrons — Team Handoff Document

Live site: **https://www.foodpatrons.com**
Last updated: 2026-07-22

This is the single reference for anyone joining the project — developers, data entry staff, the CEO/operator, and marketing. It covers the tech stack, every account needed to run the business, how to operate day-to-day, and a clear list of what's unfinished.

---

## 1. What this is

Foodpatrons is a location-based restaurant discovery site for Dhaka, Bangladesh: browse/search restaurants by area and cuisine, see offers, make reservations, claim coupons, view a live map, read/write community posts and reviews, and see local food events. Restaurants can apply to be listed, get their own staff login, and manage their own offers/reservations. Admins run everything from one dashboard.

---

## 2. Tech stack (for developers)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| Animation | `motion` (Framer Motion successor) |
| UI primitives | Radix UI / shadcn-style components |
| Database + Auth | Supabase (hosted Postgres + Auth + Realtime) |
| Maps | Leaflet + react-leaflet, OpenStreetMap tiles (free, no API key) |
| Icons | lucide-react |
| Hosting/CI | Vercel (auto-builds on deploy, custom domain attached) |

No separate backend server exists — "backend" is Supabase (database, auth, file storage if used, row-level security policies, and Postgres trigger functions) plus a handful of Next.js API routes in `src/app/api/*` that use a privileged Supabase key for narrow server-side operations.

### Running it locally
```
git clone <this codebase — see §6, there is currently no remote>
cd foodpatrons
npm install
# create .env.local with the variables listed in §5
npm run dev       # local dev server
npm run build      # production build check
npm run lint        # ESLint
```

### Deploying
Deploys go to Vercel. From the project folder:
```
npx vercel --prod --yes
```
This builds and pushes straight to production at www.foodpatrons.com. There is no staging environment — every prod deploy is live immediately. Vercel project: `foodpatrons` (org/team ID `team_inxnA3pq3AwrVHZ7HjT22tqd`).

---

## 3. Accounts required to operate the business

Whoever takes over needs *owner or admin access* to each of these. All were set up under mdiltemas@gmail.com unless noted.

| Account | Purpose | Status |
|---|---|---|
| **Vercel** (vercel.com) | Hosts the live website, runs builds, holds environment variables/secrets | Active, connected to the custom domain |
| **Domain registrar** for foodpatrons.com | Owns the domain name itself | Wherever the domain was originally purchased — confirm with whoever registered it; DNS currently points at Vercel |
| **Supabase** (supabase.com) | Database, authentication, file storage, all business data | Active — this is the most important account. Whoever has access can read/export all user data, restaurant data, reservations, etc. |
| **GitHub/GitLab** (or similar) | Source control / team collaboration on code | **Does not exist yet** — the code currently lives only on one local machine + whatever is deployed to Vercel. This is the top priority item for onboarding a dev team (see §6) |
| Google Cloud Console | Previously used for Google Maps | **No longer needed** — the site now uses free OpenStreetMap tiles instead (see §6) |

---

## 4. Team roles — what each person does

### Developers
- Work in this codebase (Next.js/TypeScript). Once a git remote exists (§6), standard PR workflow.
- Database schema changes are plain SQL files under `supabase/*.sql` — run manually in the Supabase SQL editor (Supabase dashboard → SQL Editor). There is no migration runner; each `.sql` file must be pasted in and executed by hand, in the order they were written. See §7 for which ones are still pending.
- Local `.env.local` variables are listed in §5; production copies live in Vercel → Project → Settings → Environment Variables.

### Data entry personnel
Everything is done through the **Admin dashboard** at `/admin` (log in with an account that has the `admin` role — see "How to make someone admin" below). Tabs:
- **Applications** — approve/reject restaurants that applied to join the platform.
- **Users** — see every registered user, search by name/email, and change anyone's role (customer / restaurant staff / admin) directly from a dropdown — no SQL needed.
- **Restaurants** — add/edit restaurant listings: name, cuisine, address, area, phone, hours, price range, photos, map coordinates, tags (e.g. rooftop, buffet).
- **Offers** — create/edit discount offers tied to a restaurant.
- **Events** — add local food events manually (title, date, time, venue, optional linked restaurant, image, source link). There is no automatic feed — see §6.
- **Ads** — create pop-up/banner ads, upload an image, and choose where they appear (currently only the homepage pop-up and footer ad slot are actually shown on the site — see §6).
- **Reservations / Coupons** — view and manage customer bookings and claimed coupons.
- **Reviews / Community** — moderate reviews and community posts.

**How to make someone admin** (until then, only via SQL — the Users tab requires you to already be an admin once):
1. In Supabase → SQL Editor, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'the-persons-email@example.com';
   ```
2. That person logs out and back in; they'll now see the admin dashboard link.
3. After that, all further role changes (promoting others, assigning restaurant staff) can be done from the Users tab in `/admin` — no more SQL required.

### CEO / operator
- **Analytics tab** in `/admin` — traffic and engagement numbers.
- Full visibility into every other tab (applications pipeline, user growth, reservation volume).
- Owns/should hold the actual account credentials for Vercel, Supabase, and the domain registrar (§3) — these are the accounts that, if lost, mean losing control of the live site.

### Marketing
- **Offers** and **Events** tabs to run promotions and keep local happenings current.
- **Community** tab to see and encourage user-generated posts/discussion.
- Pop-up ads (Ads tab): create an ad, upload its image, and pick which slot it shows in. Right now only the homepage pop-up (shown once per visit) and the footer banner are wired up on the live site — ads created for other slots won't currently display anywhere (see §6).

---

## 5. Environment variables

Set in `.env.local` for local dev, and in Vercel's Environment Variables settings for production. **Never commit `.env.local` to git.**

| Variable | Status | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set | Public Supabase key, safe for client-side use, respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Set | Privileged key, server-side only, bypasses RLS — never expose to the browser |
| `RESEND_API_KEY` | **Empty** | Needed to activate transactional email (application approved/rejected, etc.). Get one at resend.com and add it in Vercel |

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` were confirmed dead (leftover from the pre-Leaflet map and the old password-based admin login) and have been removed from both Vercel and local `.env.local`.

---

## 6. Known gaps / priority action items

1. **No source control remote.** The code exists only on one local machine (plus whatever's live on Vercel). Before bringing on any developer, create a private GitHub (or GitLab) repository and push this codebase to it. Without this, there is no backup, no code review, and no way for a second developer to work on it.
2. **Four database migrations have not been confirmed run** on the live database yet. Each is a `.sql` file in `supabase/` that needs to be pasted into the Supabase SQL Editor and executed, in this order:
   - `supabase/restaurant_tags.sql` — adds rooftop/buffet/etc. tags to restaurants and backfills real ones.
   - `supabase/events.sql` — creates the events feature's table.
   - `supabase/notifications.sql` — creates the notification bell feature (comments, reservation status, new bookings/claims, application status).
   - `supabase/admin_user_management.sql` — lets admins see and manage all users from the dashboard instead of raw SQL.
   - `supabase/membership_points.sql` — creates the membership points/tier system.
   Until these run, the corresponding features degrade gracefully (empty states, no crashes) but won't actually work yet.
3. **No automated events feed.** There is no Facebook/Meta integration — that would require Meta's Events API app review and business verification, which isn't in place, and scraping Facebook isn't something this codebase does. Events are entirely admin-curated via the Events tab.
4. **No transactional email.** New restaurant applications, approvals/rejections, etc. don't send real emails yet — the code is ready (see `RESEND_API_KEY` in §5), it just needs a Resend account and key added.
5. **Google Maps is fully retired.** The site was rebuilt on Leaflet + OpenStreetMap after repeated, unresolvable Google Cloud Console billing/referrer errors. This needs no API key or account and currently costs nothing. If traffic grows significantly, OpenStreetMap's free tile server may need to be swapped for a paid tile provider (Mapbox, MapTiler, Stadia Maps) to stay within its fair-use limits — not urgent today.
6. **Gulshan/Banani restaurant tagging pass is incomplete.** Restaurant data for Dhanmondi and Uttara areas was fully researched and added; a similar rooftop/buffet-tagging and gap-check pass for Gulshan/Banani was started but not finished and should be redone.
7. **No AI search.** An "Ask AI" natural-language search was built and then removed — it required a paid Anthropic API key per request, which wasn't worth the ongoing cost. Regular text/category search covers the same ground for free.

---

## 7. Data honesty policy (important for whoever enters data going forward)

This site never fabricates ratings, reviews, photos, or events for real named businesses — every restaurant and event added has been sourced from real, verifiable information. Anyone doing data entry going forward should keep to that standard: only add real, sourced restaurant/event details, and leave a field blank rather than guessing/inventing a value.

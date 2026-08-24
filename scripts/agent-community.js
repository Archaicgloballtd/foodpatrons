// Official "foodpatrons" account posts real, factual updates to the
// community feed — new restaurants that joined, live offers currently
// running. Never invents anything: every post is generated straight from
// what's already in the database, tagged to the real restaurant so its
// real photo shows on the post. Never re-posts about the same
// restaurant/offer twice (checked against the official account's own post
// history before posting).
//
// Usage: node scripts/agent-community.js [--max-new=3] [--max-offers=3]

const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const OFFICIAL_EMAIL = "platform@foodpatrons-system.internal";
const OFFICIAL_NAME = "foodpatrons";

function argNum(flag, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return arg ? Number(arg.split("=")[1]) : fallback;
}

const MAX_NEW = argNum("max-new", 3);
const MAX_OFFERS = argNum("max-offers", 3);

async function ensureOfficialAccount() {
  const { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users.find((u) => u.email === OFFICIAL_EMAIL);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: OFFICIAL_EMAIL,
      password: require("crypto").randomBytes(24).toString("hex"), // never logged in via password — API-driven only
      email_confirm: true,
      user_metadata: { full_name: OFFICIAL_NAME },
    });
    if (error) throw new Error(`Couldn't create official account: ${error.message}`);
    user = data.user;
  }

  await supabase.from("profiles").update({ is_official: true, full_name: OFFICIAL_NAME }).eq("id", user.id);
  return user.id;
}

async function getTopicId(slug) {
  const { data } = await supabase.from("topics").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

async function alreadyPosted(officialId, restaurantId) {
  const { data } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", officialId)
    .eq("restaurant_id", restaurantId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function main() {
  const officialId = await ensureOfficialAccount();
  const newsTopicId = await getTopicId("news");
  const dealsTopicId = await getTopicId("deals");

  let posted = 0;

  // New restaurants
  const { data: recentRestaurants } = await supabase
    .from("restaurants")
    .select("id, name, area, cuisine")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  for (const r of recentRestaurants ?? []) {
    if (posted >= MAX_NEW) break;
    if (await alreadyPosted(officialId, r.id)) continue;
    const content = `Just added to foodpatrons: ${r.name}${r.area ? ` in ${r.area}` : ""}${
      r.cuisine ? ` — ${r.cuisine} cuisine` : ""
    }. Check it out and reserve a table free.`;
    const { error } = await supabase.from("posts").insert({
      author_id: officialId,
      topic_id: newsTopicId,
      content,
      restaurant_id: r.id,
    });
    if (!error) {
      posted++;
      console.log(`Posted (new listing): ${r.name}`);
    }
  }

  // Live offers
  let offersPosted = 0;
  const { data: activeOffers } = await supabase
    .from("offers")
    .select("id, title, discount_percent, restaurant_id, restaurants(name, area)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  for (const o of activeOffers ?? []) {
    if (offersPosted >= MAX_OFFERS) break;
    if (await alreadyPosted(officialId, o.restaurant_id)) continue;
    const restaurant = Array.isArray(o.restaurants) ? o.restaurants[0] : o.restaurants;
    const discount = o.discount_percent ? `${o.discount_percent}% off` : "a live offer";
    const content = `Live deal: ${discount} at ${restaurant?.name ?? "a restaurant"}${
      restaurant?.area ? ` (${restaurant.area})` : ""
    } — "${o.title}". Claim it free on foodpatrons before it ends.`;
    const { error } = await supabase.from("posts").insert({
      author_id: officialId,
      topic_id: dealsTopicId,
      content,
      restaurant_id: o.restaurant_id,
    });
    if (!error) {
      offersPosted++;
      console.log(`Posted (live offer): ${restaurant?.name}`);
    }
  }

  console.log(`\nDone. ${posted} new-listing post(s), ${offersPosted} live-offer post(s).`);
}

main().catch((err) => {
  console.error("agent-community failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

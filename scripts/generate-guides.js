// Growth/SEO content agent. Finds real (area, cuisine) combinations in the
// restaurants table that have enough listings to be worth a guide and don't
// already have one, then writes a factual draft guide grounded entirely in
// what's already in the database (name, area, cuisine, price, rating) —
// never invented specifics about a place. Drafts land as is_published=false
// for an admin to review in /admin → Content before they go live.
//
// Usage: node scripts/generate-guides.js [--max=3]

const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const envText = fs.readFileSync(".env.local", "utf8");
function envVar(name) {
  const m = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}
const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const maxArg = process.argv.find((a) => a.startsWith("--max="));
const MAX_NEW_GUIDES = maxArg ? Number(maxArg.split("=")[1]) : 3;
const MIN_RESTAURANTS_FOR_AREA_GUIDE = 5;
const MIN_RESTAURANTS_FOR_CUISINE_GUIDE = 6;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tierLabel(priceRange) {
  return { "৳": "budget-friendly", "৳৳": "mid-range", "৳৳৳": "upscale" }[priceRange] ?? null;
}

function buildAreaGuide(area, city, restaurants) {
  const title = `Best restaurants in ${area}, ${city}`;
  const cuisines = [...new Set(restaurants.map((r) => r.cuisine).filter(Boolean))];
  const rated = restaurants.filter((r) => r.rating !== null).sort((a, b) => b.rating - a.rating);
  const top = rated.slice(0, 3).map((r) => r.name);
  const tierCounts = restaurants.reduce((acc, r) => {
    const label = tierLabel(r.price_range);
    if (label) acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const dominantTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const paragraphs = [
    `${area} in ${city} is one of the areas foodpatrons covers, with ${restaurants.length} real, listed restaurants and cafes on the platform${
      cuisines.length ? ` spanning ${cuisines.slice(0, 5).join(", ")}${cuisines.length > 5 ? " and more" : ""} cuisine` : ""
    }${dominantTier ? `, most of them ${dominantTier}` : ""}.`,
    top.length
      ? `Among the highest-rated spots currently listed in ${area} are ${top.join(", ")} — see the full list below with live ratings, price range, and one-tap reservations.`
      : `See the full list below with price range and one-tap reservations.`,
    `Every place on this list is a real, verified listing on foodpatrons — tap through to check current hours, claim any live offers, and reserve a table directly.`,
  ];

  return {
    slug: slugify(`best-restaurants-${area}-${city}`),
    title,
    excerpt: `${restaurants.length} real restaurants and cafes in ${area}, ${city} — browse, compare, and reserve.`,
    content: paragraphs.join("\n\n"),
    social_caption: `Looking for where to eat in ${area}, ${city}? We've got ${restaurants.length} real spots listed on foodpatrons — browse & reserve free: foodpatrons.com/guides/${slugify(`best-restaurants-${area}-${city}`)}`,
    city,
    category: area,
    restaurant_ids: restaurants.map((r) => r.id),
  };
}

function buildCuisineGuide(cuisine, restaurants) {
  const areas = [...new Set(restaurants.map((r) => r.area).filter(Boolean))];
  const title = `Best ${cuisine} restaurants across Bangladesh`;

  const paragraphs = [
    `Craving ${cuisine.toLowerCase()}? foodpatrons currently lists ${restaurants.length} ${cuisine.toLowerCase()} restaurants and cafes${
      areas.length ? ` across ${areas.slice(0, 6).join(", ")}${areas.length > 6 ? " and other areas" : ""}` : ""
    }.`,
    `Every listing below is a real, verified restaurant — browse by area, check the price range and rating, and reserve a table in a couple of taps.`,
  ];

  return {
    slug: slugify(`best-${cuisine}-restaurants-bangladesh`),
    title,
    excerpt: `${restaurants.length} real ${cuisine.toLowerCase()} restaurants and cafes across Bangladesh, all on foodpatrons.`,
    content: paragraphs.join("\n\n"),
    social_caption: `${restaurants.length} real ${cuisine} spots across Bangladesh, all bookable free on foodpatrons: foodpatrons.com/guides/${slugify(`best-${cuisine}-restaurants-bangladesh`)}`,
    city: null,
    category: cuisine,
    restaurant_ids: restaurants.map((r) => r.id),
  };
}

async function main() {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, area, cuisine, price_range, rating, address");
  if (error) {
    console.error("Failed to fetch restaurants:", error.message);
    process.exit(1);
  }

  const { data: existingPosts } = await supabase.from("blog_posts").select("slug");
  const existingSlugs = new Set((existingPosts ?? []).map((p) => p.slug));

  function cityFromAddress(r) {
    if (!r.address) return null;
    const parts = r.address.split(",").map((p) => p.trim());
    return parts[parts.length - 1] || null;
  }

  // Group by (area, city)
  const areaGroups = new Map();
  for (const r of restaurants) {
    if (!r.area) continue;
    const city = cityFromAddress(r) ?? "Bangladesh";
    const key = `${r.area}|||${city}`;
    if (!areaGroups.has(key)) areaGroups.set(key, { area: r.area, city, restaurants: [] });
    areaGroups.get(key).restaurants.push(r);
  }

  // Group by cuisine
  const cuisineGroups = new Map();
  for (const r of restaurants) {
    if (!r.cuisine) continue;
    if (!cuisineGroups.has(r.cuisine)) cuisineGroups.set(r.cuisine, []);
    cuisineGroups.get(r.cuisine).push(r);
  }

  const candidates = [];

  for (const { area, city, restaurants: list } of areaGroups.values()) {
    if (list.length < MIN_RESTAURANTS_FOR_AREA_GUIDE) continue;
    const guide = buildAreaGuide(area, city, list);
    if (!existingSlugs.has(guide.slug)) candidates.push(guide);
  }

  for (const [cuisine, list] of cuisineGroups.entries()) {
    if (list.length < MIN_RESTAURANTS_FOR_CUISINE_GUIDE) continue;
    const guide = buildCuisineGuide(cuisine, list);
    if (!existingSlugs.has(guide.slug)) candidates.push(guide);
  }

  const toInsert = candidates.slice(0, MAX_NEW_GUIDES).map((g) => ({ ...g, is_published: false }));

  if (toInsert.length === 0) {
    console.log("No new guide candidates found (all covered, or nothing meets the minimum listing threshold).");
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("blog_posts")
    .insert(toInsert)
    .select("slug, title");

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`Created ${inserted.length} new draft guide(s):`);
  for (const post of inserted) console.log(` - ${post.title} (/guides/${post.slug})`);
}

main();

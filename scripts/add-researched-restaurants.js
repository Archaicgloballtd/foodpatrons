// Reusable: insert a batch of web-researched restaurants from a JSON file.
// Skips anything whose name already exists (case-insensitive). Only fields
// present in the source JSON get set — no fabricated defaults beyond the
// standard "approved and visible" flags every manually-added listing gets.
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/add-researched-restaurants.js <path-to-json>");
  process.exit(1);
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(file, "utf8"));
  let inserted = 0;
  let skipped = 0;

  for (const r of restaurants) {
    const { data: existing } = await supabase.from("restaurants").select("id").ilike("name", r.name).maybeSingle();
    if (existing) {
      console.log(`Skipped (already exists): ${r.name}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("restaurants").insert({
      name: r.name,
      cuisine: r.cuisine ?? null,
      address: r.address ?? null,
      area: r.area ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      phone: r.phone ?? null,
      opening_hours: r.opening_hours ?? null,
      price_range: r.price_range ?? null,
      description: r.description ?? null,
      slug: slugify(r.name),
      is_approved: true,
      status: "approved",
      is_featured: false,
      is_open: true,
    });

    if (error) {
      console.error(`Failed: ${r.name} — ${error.message}`);
      continue;
    }
    console.log(`Added: ${r.name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} already-existing.`);
}

main();

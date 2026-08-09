// Agent Design. Generates an on-brand, Instagram-square promo graphic for a
// real restaurant already on foodpatrons — name, cuisine, area, rating, and
// price tier only (all pulled from the database, nothing invented).
//
// Single restaurant:  node scripts/agent-design.js "<restaurant name or id>"
// Batch (automation): node scripts/agent-design.js --batch=10
//   Uploads to the "design-assets" Supabase Storage bucket and skips any
//   restaurant that already has a file there, so repeated runs only cover
//   new ground.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const TIER_LABEL = { "৳": "Budget-friendly", "৳৳": "Mid-range", "৳৳৳": "Upscale" };
const BUCKET = "design-assets";

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildSvg(r) {
  const name = escapeXml(r.name);
  const sub = escapeXml([r.cuisine, r.area].filter(Boolean).join(" · "));
  const rating = r.rating !== null ? r.rating.toFixed(1) : null;
  const tier = TIER_LABEL[r.price_range] ?? null;

  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#1B2560"/>
  <path d="M0 780 C 250 720, 450 850, 1080 760 L1080 1080 L0 1080 Z" fill="#F97316" opacity="0.9"/>

  <g transform="translate(80,90)">
    <mask id="bite">
      <rect width="120" height="120" fill="white"/>
      <circle cx="82" cy="30" r="20" fill="black"/>
    </mask>
    <path d="M60 8 C38 8 22 26 22 48 C22 82 60 108 60 108 C60 108 98 82 98 48 C98 26 82 8 60 8 Z" fill="#F97316" mask="url(#bite)"/>
  </g>
  <text x="220" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44" fill="#ffffff">foodpatrons</text>

  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="72" fill="#ffffff">${name}</text>
  <text x="80" y="475" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="34" fill="#FACC15">${sub}</text>

  ${rating ? `<g transform="translate(80,520)"><rect width="140" height="56" rx="16" fill="#14B8A6"/><text x="70" y="37" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">★ ${rating}</text></g>` : ""}
  ${tier ? `<g transform="translate(${rating ? 240 : 80},520)"><rect width="220" height="56" rx="16" fill="#ffffff" opacity="0.15"/><text x="110" y="37" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="26" fill="#ffffff" text-anchor="middle">${escapeXml(tier)}</text></g>` : ""}

  <text x="80" y="960" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="#1B2560">Reserve free on foodpatrons.com</text>
</svg>`;
}

async function renderJpeg(restaurant) {
  const svg = buildSvg(restaurant);
  return sharp(Buffer.from(svg)).flatten({ background: "#1B2560" }).jpeg({ quality: 95 }).toBuffer();
}

async function runSingle(query) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(query);
  const { data: restaurant, error } = isUuid
    ? await supabase.from("restaurants").select("id, name, cuisine, area, rating, price_range").eq("id", query).maybeSingle()
    : await supabase.from("restaurants").select("id, name, cuisine, area, rating, price_range").ilike("name", `%${query}%`).limit(1).maybeSingle();

  if (error || !restaurant) {
    console.error("Restaurant not found:", error?.message ?? query);
    process.exit(1);
  }

  const buffer = await renderJpeg(restaurant);
  const outDir = path.join(__dirname, "..", "agent-design-output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slugify(restaurant.name)}.jpg`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved: ${outPath}`);
}

async function runBatch(max) {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, cuisine, area, rating, price_range, cover_image_url, image_url")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch restaurants:", error.message);
    process.exit(1);
  }

  const { data: existingFiles, error: listError } = await supabase.storage.from(BUCKET).list("", { limit: 5000 });
  if (listError) {
    console.error("Failed to list bucket:", listError.message);
    process.exit(1);
  }
  const existingSlugs = new Set((existingFiles ?? []).map((f) => f.name.replace(/\.jpg$/, "")));

  // Prioritize restaurants that don't have a real photo — the promo card is
  // most useful for them — then fill remaining slots with anything left.
  const withoutPhoto = restaurants.filter((r) => !existingSlugs.has(slugify(r.name)) && !r.cover_image_url && !r.image_url);
  const rest = restaurants.filter((r) => !existingSlugs.has(slugify(r.name)) && (r.cover_image_url || r.image_url));
  const candidates = [...withoutPhoto, ...rest].slice(0, max);

  if (candidates.length === 0) {
    console.log("No new restaurants need a promo graphic — every one already has an asset.");
    return;
  }

  const created = [];
  for (const r of candidates) {
    const buffer = await renderJpeg(r);
    const fileName = `${slugify(r.name)}.jpg`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (uploadError) {
      console.error(`Failed to upload ${r.name}:`, uploadError.message);
      continue;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    created.push({ name: r.name, url: pub.publicUrl });
  }

  console.log(`Generated ${created.length} new promo graphic(s):`);
  for (const c of created) console.log(` - ${c.name}: ${c.url}`);
}

async function main() {
  const batchArg = process.argv.find((a) => a.startsWith("--batch="));
  if (batchArg) {
    await runBatch(Number(batchArg.split("=")[1]));
    return;
  }
  const query = process.argv[2];
  if (!query) {
    console.error('Usage: node scripts/agent-design.js "<restaurant name or id>"  OR  node scripts/agent-design.js --batch=10');
    process.exit(1);
  }
  await runSingle(query);
}

main();

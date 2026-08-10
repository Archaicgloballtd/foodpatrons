// Summarizes what all 4 agents did in the last N hours (default 26, to
// comfortably cover a "since yesterday" window with some slack).
//
// Usage: node scripts/agent-report.js [--hours=26]

const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const hoursArg = process.argv.find((a) => a.startsWith("--hours="));
const HOURS = hoursArg ? Number(hoursArg.split("=")[1]) : 26;
const since = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString();

async function main() {
  const [guides, outreach, design, restaurants] = await Promise.all([
    supabase.from("blog_posts").select("slug, title, is_published").gte("created_at", since),
    supabase.from("outreach_queue").select("id").gte("created_at", since),
    supabase.storage.from("design-assets").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } }),
    supabase.from("restaurants").select("id, name").gte("updated_at", since),
  ]);

  const newGuides = guides.data ?? [];
  const newOutreach = outreach.data ?? [];
  const newDesigns = (design.data ?? []).filter((f) => f.created_at && f.created_at >= since);
  const dataTrackingAvailable = !restaurants.error;
  const updatedRestaurants = restaurants.data ?? [];

  const lines = [];
  lines.push(`Foodpatrons agent report — last ${HOURS}h (since ${since})`);
  lines.push("");
  lines.push(`Agent Growth: ${newGuides.length} new guide(s)`);
  for (const g of newGuides) lines.push(`  - ${g.title}${g.is_published ? "" : " (draft, not yet published)"}`);
  lines.push("");
  lines.push(`Agent Design: ${newDesigns.length} new promo graphic(s)`);
  for (const d of newDesigns) lines.push(`  - ${d.name}`);
  lines.push("");
  lines.push(`Agent Sales: ${newOutreach.length} new outreach draft(s) queued`);
  lines.push("");
  if (dataTrackingAvailable) {
    lines.push(`Agent Data: ${updatedRestaurants.length} restaurant(s) updated with real research`);
    for (const r of updatedRestaurants) lines.push(`  - ${r.name}`);
  } else {
    lines.push("Agent Data: tracking unavailable (run the restaurant_email.sql migration to enable this)");
  }
  lines.push("");
  lines.push(
    `Total: ${newGuides.length + newDesigns.length + newOutreach.length + (dataTrackingAvailable ? updatedRestaurants.length : 0)} items across all agents.`,
  );

  console.log(lines.join("\n"));
}

main();

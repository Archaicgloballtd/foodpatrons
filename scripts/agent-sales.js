// Agent Sales. Finds real, unclaimed restaurants (no restaurant_staff row)
// that don't already have a queued outreach draft, and writes a factual,
// personalized message inviting them to claim their free listing. Nothing
// is ever sent — drafts land in outreach_queue for an admin to review, copy,
// and send themselves via whatever channel they find for that restaurant.
//
// Usage: node scripts/agent-sales.js [--max=20]

const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const maxArg = process.argv.find((a) => a.startsWith("--max="));
const MAX_NEW_DRAFTS = maxArg ? Number(maxArg.split("=")[1]) : 20;

function draftMessage(restaurant) {
  const { name, area, cuisine } = restaurant;
  return `Hi! We noticed ${name}${area ? ` in ${area}` : ""} is already listed on foodpatrons.com${
    cuisine ? ` under ${cuisine}` : ""
  }. You can claim this listing for free — manage your menu, hours, and photos, respond to customer reviews, run offers, and see reservations come in directly. Claim it in a couple of minutes at foodpatrons.com/login (choose "I'm a restaurant owner" and select ${name} from the list). No cost, no obligation.`;
}

async function main() {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, area, cuisine, rating")
    .order("rating", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("Failed to fetch restaurants:", error.message);
    process.exit(1);
  }

  const { data: staffRows } = await supabase.from("restaurant_staff").select("restaurant_id");
  const claimedIds = new Set((staffRows ?? []).map((s) => s.restaurant_id));

  const { data: queued } = await supabase.from("outreach_queue").select("restaurant_id");
  const queuedIds = new Set((queued ?? []).map((q) => q.restaurant_id));

  const candidates = restaurants.filter((r) => !claimedIds.has(r.id) && !queuedIds.has(r.id));

  if (candidates.length === 0) {
    console.log("No new outreach candidates — every restaurant is either claimed or already queued.");
    return;
  }

  const toInsert = candidates.slice(0, MAX_NEW_DRAFTS).map((r) => ({
    restaurant_id: r.id,
    message: draftMessage(r),
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("outreach_queue")
    .insert(toInsert)
    .select("id, restaurant_id");

  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`Drafted ${inserted.length} new outreach message(s). ${candidates.length - inserted.length} more candidates remain for next run.`);
}

main();

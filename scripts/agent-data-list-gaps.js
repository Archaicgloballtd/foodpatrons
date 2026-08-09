// Agent Data (research step, part 1 of 2). Prints a JSON worklist of real
// restaurants with the most missing fields, worst-first, for a research
// agent (human or cloud agent with web search) to look up.
//
// Usage: node scripts/agent-data-list-gaps.js [--max=10]

const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const maxArg = process.argv.find((a) => a.startsWith("--max="));
const MAX = maxArg ? Number(maxArg.split("=")[1]) : 10;

function missing(r) {
  const gaps = [];
  if (!r.phone) gaps.push("phone");
  if (!r.opening_hours) gaps.push("opening_hours");
  if (!r.description) gaps.push("description");
  if ("email" in r && !r.email) gaps.push("email");
  return gaps;
}

async function main() {
  // `email` is a newer column that may not exist yet on every environment —
  // fall back to the select without it rather than erroring outright.
  const withEmail = await supabase
    .from("restaurants")
    .select("id, name, area, address, cuisine, phone, opening_hours, description, email");
  let data = withEmail.data;
  let error = withEmail.error;
  if (error) {
    const retry = await supabase
      .from("restaurants")
      .select("id, name, area, address, cuisine, phone, opening_hours, description");
    data = retry.data;
    error = retry.error;
  }
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const worklist = data
    .map((r) => ({ ...r, gaps: missing(r) }))
    .filter((r) => r.gaps.length > 0)
    .sort((a, b) => b.gaps.length - a.gaps.length)
    .slice(0, MAX)
    .map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area,
      address: r.address,
      cuisine: r.cuisine,
      gaps: r.gaps,
    }));

  console.log(JSON.stringify(worklist, null, 2));
}

main();

// Agent Data (research step, part 2 of 2). Applies real, web-sourced
// findings to restaurants — but ONLY to fields that are currently null, so
// this can never overwrite existing real data, even if a finding is wrong.
//
// Usage: node scripts/agent-data-apply.js <path-to-findings.json>
// findings.json shape: [{ "id": "<uuid>", "phone": "...", "opening_hours": "...", "description": "...", "email": "..." }, ...]
// Any field may be omitted per entry — only include fields you actually
// found and are confident about.

const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const ALLOWED_FIELDS = ["phone", "opening_hours", "description", "email"];

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/agent-data-apply.js <path-to-findings.json>");
    process.exit(1);
  }

  const findings = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(findings)) {
    console.error("findings.json must be a JSON array.");
    process.exit(1);
  }

  let applied = 0;
  let skipped = 0;

  for (const finding of findings) {
    if (!finding.id) {
      skipped++;
      continue;
    }
    const withEmail = await supabase
      .from("restaurants")
      .select("phone, opening_hours, description, email")
      .eq("id", finding.id)
      .maybeSingle();
    let current = withEmail.data;
    let fetchError = withEmail.error;
    if (fetchError) {
      const retry = await supabase
        .from("restaurants")
        .select("phone, opening_hours, description")
        .eq("id", finding.id)
        .maybeSingle();
      current = retry.data;
      fetchError = retry.error;
    }
    if (fetchError || !current) {
      console.error(`Skipping ${finding.id}: not found (${fetchError?.message ?? "no row"})`);
      skipped++;
      continue;
    }

    const update = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in current && current[field] == null && finding[field]) {
        update[field] = finding[field];
      }
    }

    if (Object.keys(update).length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase.from("restaurants").update(update).eq("id", finding.id);
    if (updateError) {
      console.error(`Failed to update ${finding.id}:`, updateError.message);
      skipped++;
      continue;
    }
    applied++;
    console.log(`Updated ${finding.id}: ${Object.keys(update).join(", ")}`);
  }

  console.log(`Applied ${applied} update(s), skipped ${skipped}.`);
}

main();

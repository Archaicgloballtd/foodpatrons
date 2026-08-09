const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");
const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

async function main() {
  const { count } = await supabase.from("outreach_queue").select("*", { count: "exact", head: true });
  console.log("outreach_queue total:", count);
}
main();

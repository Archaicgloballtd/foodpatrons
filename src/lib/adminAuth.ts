import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service role client for verifying who's calling a sensitive route (bulk
// email sends) — there's no user session in a route handler, only whatever
// access token the client chooses to send us, so we check it ourselves
// rather than trusting the caller.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function requireAdmin(accessToken: string | undefined | null): Promise<boolean> {
  if (!accessToken) return false;
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) return false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  return profile?.role === "admin";
}

export { supabaseAdmin };

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Same pattern as /api/track: anonymous visitors have no auth.uid() for an
// RLS policy to check, so writes go through the service role here instead.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const adId = typeof body?.adId === "string" ? body.adId : null;
  const eventType = body?.eventType === "click" ? "click" : body?.eventType === "impression" ? "impression" : null;

  if (!adId || !eventType) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await supabaseAdmin.from("ad_events").insert({ ad_id: adId, event_type: eventType });
  return NextResponse.json({ ok: true });
}

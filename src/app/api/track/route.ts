import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Writes never go through
// RLS-checked client calls — anonymous visitors have no auth.uid() for a
// policy to check, so this endpoint is the only way analytics rows get
// written at all. Reads stay admin-only (see analytics.sql).
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const MAX_LEN = 500;
function clip(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_LEN) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = clip(body?.sessionId);
  const eventType = body?.eventType === "heartbeat" ? "heartbeat" : "page_view";
  const path = clip(body?.path) ?? "/";
  const userId = clip(body?.userId);

  if (!sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (eventType === "page_view") {
    const referrer = clip(body?.referrer);
    const userAgent = clip(req.headers.get("user-agent"));

    await Promise.all([
      supabaseAdmin.from("analytics_events").insert({
        session_id: sessionId,
        user_id: userId,
        path,
      }),
      supabaseAdmin
        .from("analytics_sessions")
        .upsert(
          {
            session_id: sessionId,
            user_id: userId,
            last_seen_at: new Date().toISOString(),
            entry_path: path,
            referrer,
            user_agent: userAgent,
          },
          { onConflict: "session_id", ignoreDuplicates: false },
        ),
    ]);
  } else {
    const deltaSeconds = Math.max(0, Math.min(120, Number(body?.deltaSeconds) || 0));
    const { data: existing } = await supabaseAdmin
      .from("analytics_sessions")
      .select("duration_seconds")
      .eq("session_id", sessionId)
      .maybeSingle();

    await supabaseAdmin
      .from("analytics_sessions")
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          last_seen_at: new Date().toISOString(),
          duration_seconds: (existing?.duration_seconds ?? 0) + deltaSeconds,
        },
        { onConflict: "session_id", ignoreDuplicates: false },
      );
  }

  return NextResponse.json({ ok: true });
}

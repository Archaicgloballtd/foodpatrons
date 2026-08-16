import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { requireAdmin, supabaseAdmin } from "@/lib/adminAuth";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sends an admin-composed newsletter to every active subscriber. Subscribers
// are only people who opted in themselves via the footer form — never
// imported. Admin-gated and logs a newsletter_campaigns row so there's a
// record of what went out and to how many people.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const subject = body?.subject as string | undefined;
    const html = body?.html as string | undefined;
    const accessToken = body?.accessToken as string | undefined;

    if (!(await requireAdmin(accessToken))) {
      return NextResponse.json({ ok: false, error: "not authorized" }, { status: 403 });
    }
    if (!subject?.trim() || !html?.trim()) {
      return NextResponse.json({ ok: false, error: "missing subject or body" }, { status: 400 });
    }

    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);
    if (subError) {
      return NextResponse.json({ ok: false, error: subError.message });
    }
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ ok: false, error: "no active subscribers" });
    }

    let sent = 0;
    let failed = 0;
    // Sequential with a small gap to stay well under Resend's rate limit
    // rather than firing subscriber-count requests all at once.
    for (const { email } of subscribers) {
      const result = await sendEmail({ to: email, subject, html });
      if (result.sent) sent++;
      else failed++;
      await sleep(150);
    }

    await supabaseAdmin.from("newsletter_campaigns").insert({ subject, recipient_count: sent });

    return NextResponse.json({ ok: sent > 0, sent, failed, total: subscribers.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown error" });
  }
}

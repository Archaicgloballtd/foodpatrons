import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { requireAdmin, supabaseAdmin } from "@/lib/adminAuth";

// Sends ONE already-drafted outreach message (Agent Sales writes these into
// outreach_queue) to the restaurant's real, on-file email address. Never
// invents or looks up an address itself — if the restaurant has no email on
// file, this returns an error rather than guessing one. Admin-gated because
// this reaches a real business owner and can't be unsent.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const outreachId = body?.outreachId as string | undefined;
    const accessToken = body?.accessToken as string | undefined;

    if (!(await requireAdmin(accessToken))) {
      return NextResponse.json({ ok: false, error: "not authorized" }, { status: 403 });
    }
    if (!outreachId) {
      return NextResponse.json({ ok: false, error: "missing outreachId" }, { status: 400 });
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from("outreach_queue")
      .select("id, message, status, restaurant_id, restaurants(name, email)")
      .eq("id", outreachId)
      .single();
    if (itemError || !item) {
      return NextResponse.json({ ok: false, error: "outreach item not found" });
    }

    const restaurant = item.restaurants as unknown as { name: string; email: string | null } | null;
    if (!restaurant?.email) {
      return NextResponse.json({ ok: false, error: "no email on file for this restaurant" });
    }

    const subject = `Claim your free foodpatrons listing for ${restaurant.name}`;
    const html = `<p>Hi,</p><p>${item.message.replace(/\n/g, "<br/>")}</p>`;

    const result = await sendEmail({ to: restaurant.email, subject, html });

    if (result.sent) {
      await supabaseAdmin
        .from("outreach_queue")
        .update({ status: "contacted", emailed_at: new Date().toISOString(), email_error: null })
        .eq("id", outreachId);
    } else {
      await supabaseAdmin.from("outreach_queue").update({ email_error: result.error ?? "unknown error" }).eq("id", outreachId);
    }

    return NextResponse.json({ ok: result.sent, error: result.error });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown error" });
  }
}

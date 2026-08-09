import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// Service role client: applicants aren't the ones calling this route (an
// admin's approve/reject click is), so there's no user session to read
// their own profile row under RLS.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type NotifyType = "application_approved" | "application_rejected";

// Fire-and-forget from the admin dashboard after a DB write already
// succeeded — never throws, always 200s, so a missing RESEND_API_KEY or a
// pre-migration profiles table (no `email` column yet) can't surface as a
// scary failure in the admin UI.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const type = body?.type as NotifyType | undefined;
    const applicationId = body?.applicationId as string | undefined;
    if (!applicationId || (type !== "application_approved" && type !== "application_rejected")) {
      return NextResponse.json({ ok: false, error: "invalid request" });
    }

    const { data: application } = await supabaseAdmin
      .from("restaurant_applications")
      .select("restaurant_name, user_id, admin_note")
      .eq("id", applicationId)
      .single();
    if (!application) return NextResponse.json({ ok: false, error: "application not found" });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", application.user_id)
      .single();
    // profiles.email doesn't exist until admin_user_management.sql has run
    if (profileError || !profile?.email) {
      return NextResponse.json({ ok: false, error: "no email on file for applicant" });
    }

    const greeting = profile.full_name ? `Hi ${profile.full_name},` : "Hi,";
    const subject =
      type === "application_approved"
        ? `Your restaurant "${application.restaurant_name}" is approved on foodpatrons`
        : `Update on your foodpatrons application for "${application.restaurant_name}"`;
    const html =
      type === "application_approved"
        ? `<p>${greeting}</p><p>Good news — your application for <strong>${application.restaurant_name}</strong> has been approved. Sign in to manage your restaurant's listing, offers, and reservations.</p>`
        : `<p>${greeting}</p><p>Your application for <strong>${application.restaurant_name}</strong> wasn't approved this time.${
            application.admin_note ? ` Note from our team: "${application.admin_note}"` : ""
          }</p>`;

    const result = await sendEmail({ to: profile.email, subject, html });
    return NextResponse.json({ ok: result.sent, error: result.error });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown error" });
  }
}

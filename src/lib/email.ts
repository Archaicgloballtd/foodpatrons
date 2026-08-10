import "server-only";
import { Resend } from "resend";

// No-ops until RESEND_API_KEY is set in the environment — callers should
// treat every result as best-effort and never let it block a real DB write.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY not configured" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "foodpatrons <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}

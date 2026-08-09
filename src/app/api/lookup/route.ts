import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key — deliberately bypasses RLS,
// since reservations/coupon_claims have no public SELECT policy (customers
// don't have accounts, so there's nothing for RLS to check identity against).
// Safety instead comes from this route's own filtering: every query requires
// an exact code or a real phone-number substring, so a blank or near-empty
// query can never return the whole table.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const raw = typeof body?.query === "string" ? body.query.trim() : "";
  if (!raw) {
    return NextResponse.json({ reservations: [], claims: [] });
  }

  const code = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const digits = raw.replace(/\D/g, "");

  const conditions = [`code.eq.${code}`];
  if (digits.length >= 6) conditions.push(`customer_phone.ilike.%${digits}%`);
  const orFilter = conditions.join(",");

  const [reservationsRes, claimsRes] = await Promise.all([
    supabaseAdmin
      .from("reservations")
      .select(
        "id, code, customer_name, party_size, reservation_date, reservation_time, status, restaurants(name)",
      )
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("coupon_claims")
      .select("id, code, status, expires_at, restaurants(name), offers(title)")
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    reservations: reservationsRes.data ?? [],
    claims: claimsRes.data ?? [],
  });
}

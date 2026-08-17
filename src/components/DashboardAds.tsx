"use client";

import { useEffect, useState } from "react";
import { Megaphone, Clock, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AD_SLOTS, type AdSlotKey } from "@/lib/adSlots";

type AdRequest = {
  id: string;
  title: string;
  slot: string;
  price_amount: number | null;
  currency: string;
  payment_status: "unpaid" | "pending_review" | "paid";
  active: boolean;
  requested_at: string | null;
  impressions: number;
  clicks: number;
};

const STATUS_LABEL: Record<AdRequest["payment_status"], { label: string; className: string }> = {
  pending_review: { label: "Awaiting payment confirmation", className: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  unpaid: { label: "Unpaid", className: "bg-red-100 text-red-700" },
};

export default function DashboardAds({ restaurantId }: { restaurantId: string }) {
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<AdSlotKey>(AD_SLOTS[0].key);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: adsData } = await supabase
      .from("ads")
      .select("id, title, slot, price_amount, currency, payment_status, active, requested_at")
      .eq("restaurant_id", restaurantId)
      .order("requested_at", { ascending: false });

    const ads = adsData ?? [];
    const counts = await Promise.all(
      ads.map(async (ad) => {
        const [impressions, clicks] = await Promise.all([
          supabase.from("ad_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "impression"),
          supabase.from("ad_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "click"),
        ]);
        return { impressions: impressions.count ?? 0, clicks: clicks.count ?? 0 };
      }),
    );

    setRequests(ads.map((ad, i) => ({ ...ad, ...counts[i] }) as AdRequest));
    setLoading(false);
    void userData;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const slotInfo = AD_SLOTS.find((s) => s.key === slot)!;
    const { data: restaurant } = await supabase.from("restaurants").select("name").eq("id", restaurantId).maybeSingle();

    const { error } = await supabase.from("ads").insert({
      title: restaurant?.name ?? "Restaurant ad",
      slot,
      restaurant_id: restaurantId,
      price_amount: slotInfo.price,
      currency: "BDT",
      payment_status: "pending_review",
      active: false,
      requested_by: userData.user?.id,
      requested_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      setMessage(`Couldn't submit request: ${error.message}`);
      return;
    }
    setMessage("Request submitted! Our team will reach out at info@foodpatrons.com to confirm payment and activate it.");
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/80">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <Megaphone className="h-4 w-4 text-primary" />
          Payment is confirmed manually for now
        </p>
        <p className="mt-1">
          We don&apos;t have automated online payment wired up yet. After you request a placement below, our team
          will contact you at the email on your account to arrange payment — the ad goes live once that&apos;s
          confirmed.
        </p>
      </div>

      <form onSubmit={handleRequest} className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground">Request a placement</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Slot
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as AdSlotKey)}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {AD_SLOTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} — ৳{s.price.toLocaleString()}/mo
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Request this placement"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </form>

      <div>
        <h3 className="mb-2 text-sm font-bold text-foreground">Your requests</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ad requests yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((r) => {
              const slotLabel = AD_SLOTS.find((s) => s.key === r.slot)?.label ?? r.slot;
              const status = STATUS_LABEL[r.payment_status];
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{slotLabel}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ৳{r.price_amount?.toLocaleString() ?? "—"}/mo · {r.active ? "Live now" : "Not live yet"}
                  </p>
                  {r.active && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {r.impressions} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {r.clicks} clicks
                      </span>
                    </div>
                  )}
                  {r.requested_at && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Requested {new Date(r.requested_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

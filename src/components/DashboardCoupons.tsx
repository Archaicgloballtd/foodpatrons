"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeInsert } from "@/lib/useRealtimeInsert";
import { playChime, notifyBrowser } from "@/lib/notify";

type Coupon = {
  id: string;
  code: string;
  customer_phone: string;
  status: "unused" | "used" | "expired";
  expires_at: string;
  offer_id: string;
};

export default function DashboardCoupons({ restaurantId }: { restaurantId: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Coupon | null | "not_found">(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("coupon_claims")
      .select("id, code, customer_phone, status, expires_at, offer_id")
      .eq("restaurant_id", restaurantId)
      .order("expires_at", { ascending: false });
    setCoupons(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useRealtimeInsert<Coupon>("coupon_claims", `restaurant_id=eq.${restaurantId}`, (row) => {
    setCoupons((prev) => (prev.some((c) => c.id === row.id) ? prev : [row, ...prev]));
    setToast(`New offer claimed — code ${row.code}`);
    playChime();
    notifyBrowser("New offer claimed", `Code ${row.code} was just claimed.`);
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function markUsed(id: string) {
    await supabase.from("coupon_claims").update({ status: "used" }).eq("id", id);
    load();
    setVerifyResult(null);
    setVerifyCode("");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase
      .from("coupon_claims")
      .select("id, code, customer_phone, status, expires_at, offer_id")
      .eq("restaurant_id", restaurantId)
      .eq("code", verifyCode.trim())
      .maybeSingle();
    setVerifyResult(data ?? "not_found");
  }

  return (
    <div>
      {toast && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground">
          <span className="flex items-center gap-2">
            <BellRing className="h-4 w-4 shrink-0 text-primary" />
            {toast}
          </span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="shrink-0 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleVerify} className="mb-4 flex gap-2">
        <input
          type="text"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value)}
          placeholder="Verify coupon code (e.g. FP-O-12345)"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
        >
          Verify
        </button>
      </form>

      {verifyResult === "not_found" && (
        <p className="mb-4 text-sm text-red-600">No coupon with that code for this restaurant.</p>
      )}
      {verifyResult && verifyResult !== "not_found" && (
        <div className="mb-4 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
          <p>
            <span className="font-semibold">{verifyResult.code}</span> — {verifyResult.status} — expires{" "}
            {new Date(verifyResult.expires_at).toLocaleString()}
          </p>
          <p className="text-zinc-500">Phone: {verifyResult.customer_phone}</p>
          {verifyResult.status === "unused" && (
            <button
              type="button"
              onClick={() => markUsed(verifyResult.id)}
              className="mt-2 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
            >
              Mark as used
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading coupon claims…</p>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-zinc-500">No offers claimed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-400">
              <tr>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Expires</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-2 pr-4 font-mono text-xs">{c.code}</td>
                  <td className="py-2 pr-4">{c.customer_phone}</td>
                  <td className="py-2 pr-4">{new Date(c.expires_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.status === "used"
                          ? "bg-green-100 text-green-700"
                          : c.status === "expired"
                            ? "bg-zinc-200 text-zinc-600"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {c.status === "unused" && (
                      <button
                        type="button"
                        onClick={() => markUsed(c.id)}
                        className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Mark used
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

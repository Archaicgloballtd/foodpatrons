"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  code: string;
  customer_phone: string;
  status: string;
  expires_at: string;
  restaurants: { name: string } | null;
  offers: { title: string } | null;
};

export default function AdminCoupons() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("coupon_claims")
          .select("id, code, customer_phone, status, expires_at, restaurants(name), offers(title)")
          .order("expires_at", { ascending: false });
        if (error) throw error;
        setRows(data as unknown as Row[]);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load coupon claims.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading coupon claims…</p>;
  if (error && rows.length === 0)
    return <p className="text-sm text-destructive">Couldn&apos;t load coupon claims: {error}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No coupon claims yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">Restaurant</th>
            <th className="py-2 pr-4">Offer</th>
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Phone</th>
            <th className="py-2 pr-4">Expires</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-2 pr-4">{r.restaurants?.name ?? "—"}</td>
              <td className="py-2 pr-4">{r.offers?.title ?? "—"}</td>
              <td className="py-2 pr-4 font-mono text-xs">{r.code}</td>
              <td className="py-2 pr-4">{r.customer_phone}</td>
              <td className="py-2 pr-4">{new Date(r.expires_at).toLocaleString()}</td>
              <td className="py-2 pr-4">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

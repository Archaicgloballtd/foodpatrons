"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  restaurants: { name: string } | null;
};

export default function AdminReservations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select(
            "id, code, customer_name, customer_phone, party_size, reservation_date, reservation_time, status, restaurants(name)",
          )
          .order("reservation_date", { ascending: false });
        if (error) throw error;
        setRows(data as unknown as Row[]);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load reservations.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading reservations…</p>;
  if (error && rows.length === 0)
    return <p className="text-sm text-destructive">Couldn&apos;t load reservations: {error}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No reservations yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">Restaurant</th>
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Party</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-2 pr-4">{r.restaurants?.name ?? "—"}</td>
              <td className="py-2 pr-4 font-mono text-xs">{r.code}</td>
              <td className="py-2 pr-4">{r.customer_name}</td>
              <td className="py-2 pr-4">{r.party_size}</td>
              <td className="py-2 pr-4">{r.reservation_date}</td>
              <td className="py-2 pr-4">{r.reservation_time}</td>
              <td className="py-2 pr-4">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

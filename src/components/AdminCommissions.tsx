"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LedgerRow = {
  id: string;
  restaurant_id: string;
  amount: number;
  status: "owed" | "paid";
  created_at: string;
  restaurants: { name: string } | null;
};

type RestaurantTotal = {
  restaurantId: string;
  name: string;
  owed: number;
  owedCount: number;
};

export default function AdminCommissions() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("commission_ledger")
      .select("id, restaurant_id, amount, status, created_at, restaurants(name)")
      .order("created_at", { ascending: false });
    if (error) {
      setTableMissing(true);
      setLoading(false);
      return;
    }
    setRows((data as unknown as LedgerRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function markRestaurantPaid(restaurantId: string) {
    await supabase.from("commission_ledger").update({ status: "paid" }).eq("restaurant_id", restaurantId).eq("status", "owed");
    load();
  }

  if (tableMissing) {
    return (
      <p className="text-sm text-muted-foreground">
        Commission ledger isn&apos;t set up yet — run <code className="rounded bg-muted px-1">supabase/monetization_infrastructure.sql</code> first.
      </p>
    );
  }

  const totals = new Map<string, RestaurantTotal>();
  for (const row of rows) {
    if (row.status !== "owed") continue;
    const existing = totals.get(row.restaurant_id) ?? {
      restaurantId: row.restaurant_id,
      name: row.restaurants?.name ?? "Unknown restaurant",
      owed: 0,
      owedCount: 0,
    };
    existing.owed += row.amount;
    existing.owedCount += 1;
    totals.set(row.restaurant_id, existing);
  }
  const owedByRestaurant = [...totals.values()].sort((a, b) => b.owed - a.owed);
  const totalOwed = owedByRestaurant.reduce((sum, r) => sum + r.owed, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-foreground">
          <span className="font-bold">৳{totalOwed.toLocaleString()}</span> owed across {owedByRestaurant.length}{" "}
          restaurant{owedByRestaurant.length === 1 ? "" : "s"}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : owedByRestaurant.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing owed right now. Set a commission per fulfilled reservation on a restaurant (Restaurants tab) and
          mark reservations fulfilled from that restaurant&apos;s dashboard to start accruing commission here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {owedByRestaurant.map((r) => (
            <div key={r.restaurantId} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.owedCount} fulfilled reservation{r.owedCount === 1 ? "" : "s"} owed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-extrabold text-primary">৳{r.owed.toLocaleString()}</p>
                <button
                  type="button"
                  onClick={() => markRestaurantPaid(r.restaurantId)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90"
                >
                  Mark paid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

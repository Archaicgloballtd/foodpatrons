"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { UtensilsCrossed, Tag, Megaphone, CalendarClock, TicketPercent, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Counts = {
  restaurants: number;
  activeOffers: number;
  activeAds: number;
  pendingReservations: number;
  couponsClaimed: number;
  pendingApplications: number;
};

async function countRows(table: string, filter?: [string, boolean]): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(filter[0], filter[1]);
  const { count } = await query;
  return count ?? 0;
}

export default function AdminSummaryCards() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    async function load() {
      const [restaurants, activeOffers, activeAds, pendingReservations, couponsClaimed, pendingApplications] =
        await Promise.all([
          countRows("restaurants"),
          countRows("offers", ["is_active", true]),
          countRows("ads", ["active", true]),
          (async () => {
            const { count } = await supabase
              .from("reservations")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending");
            return count ?? 0;
          })(),
          countRows("coupon_claims"),
          (async () => {
            const { count } = await supabase
              .from("restaurant_applications")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending");
            return count ?? 0;
          })(),
        ]);
      setCounts({ restaurants, activeOffers, activeAds, pendingReservations, couponsClaimed, pendingApplications });
    }
    load();
  }, []);

  const cards: { label: string; value: number | null; icon: LucideIcon; color: string }[] = [
    { label: "Restaurants", value: counts?.restaurants ?? null, icon: UtensilsCrossed, color: "text-primary bg-primary/10" },
    { label: "Active offers", value: counts?.activeOffers ?? null, icon: Tag, color: "text-brand-purple bg-brand-purple/10" },
    { label: "Active ads", value: counts?.activeAds ?? null, icon: Megaphone, color: "text-brand-turquoise bg-brand-turquoise/10" },
    { label: "Pending reservations", value: counts?.pendingReservations ?? null, icon: CalendarClock, color: "text-brand-coral bg-brand-coral/10" },
    { label: "Coupons claimed", value: counts?.couponsClaimed ?? null, icon: TicketPercent, color: "text-secondary bg-secondary/10" },
    { label: "Pending applications", value: counts?.pendingApplications ?? null, icon: Store, color: "text-brand-sunny bg-brand-sunny/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{value === null ? "—" : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

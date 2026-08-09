"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequireRole from "@/components/RequireRole";
import DashboardReservations from "@/components/DashboardReservations";
import DashboardCoupons from "@/components/DashboardCoupons";
import DashboardOffers from "@/components/DashboardOffers";
import DashboardMenu from "@/components/DashboardMenu";
import DashboardRestaurantProfile from "@/components/DashboardRestaurantProfile";
import DashboardReviews from "@/components/DashboardReviews";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type RestaurantOption = { id: string; name: string };
type Tab = "reservations" | "coupons" | "offers" | "menu" | "reviews" | "profile";

function DashboardContent() {
  const { user, profile } = useSession();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedIdOverride, setSelectedIdOverride] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("reservations");
  const [loading, setLoading] = useState(true);
  const selectedId = selectedIdOverride ?? restaurants[0]?.id ?? "";

  useEffect(() => {
    async function load() {
      if (!user) return;
      if (profile?.role === "admin") {
        const { data } = await supabase.from("restaurants").select("id, name").order("name");
        setRestaurants(data ?? []);
      } else {
        const { data } = await supabase
          .from("restaurant_staff")
          .select("restaurants(id, name)")
          .eq("user_id", user.id);
        const list =
          data
            ?.map((row) => row.restaurants)
            .flat()
            .filter((r): r is RestaurantOption => r !== null) ?? [];
        setRestaurants(list);
      }
      setLoading(false);
    }
    load();
  }, [user, profile]);

  if (loading) {
    return <p className="p-8 text-center text-sm text-zinc-500">Loading your restaurants…</p>;
  }

  if (restaurants.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        No restaurant is assigned to your account yet. Ask an admin to add you as staff.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Restaurant dashboard</h1>

      <select
        value={selectedId}
        onChange={(e) => setSelectedIdOverride(e.target.value)}
        className="mt-4 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <div className="mt-6 flex gap-2 border-b border-black/10 dark:border-white/10">
        {(["reservations", "coupons", "offers", "menu", "reviews", "profile"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "border-b-2 border-orange-600 text-orange-600" : "text-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {selectedId && tab === "reservations" && <DashboardReservations restaurantId={selectedId} />}
        {selectedId && tab === "coupons" && <DashboardCoupons restaurantId={selectedId} />}
        {selectedId && tab === "offers" && <DashboardOffers restaurantId={selectedId} />}
        {selectedId && tab === "menu" && <DashboardMenu restaurantId={selectedId} />}
        {selectedId && tab === "reviews" && <DashboardReviews restaurantId={selectedId} />}
        {selectedId && tab === "profile" && <DashboardRestaurantProfile restaurantId={selectedId} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <RequireRole role="staff">
          <DashboardContent />
        </RequireRole>
      </main>
      <Footer />
    </div>
  );
}

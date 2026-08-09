"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth";
import { LogoMark } from "./Logo";
import AdminSummaryCards from "./AdminSummaryCards";
import AdminApplications from "./AdminApplications";
import AdminRestaurants from "./AdminRestaurants";
import AdminOffers from "./AdminOffers";
import AdminAds from "./AdminAds";
import AdminReservations from "./AdminReservations";
import AdminCoupons from "./AdminCoupons";
import AdminReviews from "./AdminReviews";
import AdminAnalytics from "./AdminAnalytics";
import AdminCommunity from "./AdminCommunity";
import AdminEvents from "./AdminEvents";
import AdminUsers from "./AdminUsers";
import AdminAgents from "./AdminAgents";

type Tab =
  | "applications"
  | "users"
  | "restaurants"
  | "offers"
  | "events"
  | "ads"
  | "reservations"
  | "coupons"
  | "reviews"
  | "community"
  | "agents"
  | "analytics";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("applications");

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
            {user?.email && <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>

      <div className="mt-6">
        <AdminSummaryCards />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
        {(
          [
            "applications",
            "users",
            "restaurants",
            "offers",
            "events",
            "ads",
            "reservations",
            "coupons",
            "reviews",
            "community",
            "agents",
            "analytics",
          ] as Tab[]
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "applications" && <AdminApplications />}
        {tab === "users" && <AdminUsers />}
        {tab === "restaurants" && <AdminRestaurants />}
        {tab === "offers" && <AdminOffers />}
        {tab === "events" && <AdminEvents />}
        {tab === "ads" && <AdminAds />}
        {tab === "reservations" && <AdminReservations />}
        {tab === "coupons" && <AdminCoupons />}
        {tab === "reviews" && <AdminReviews />}
        {tab === "community" && <AdminCommunity />}
        {tab === "agents" && <AdminAgents />}
        {tab === "analytics" && <AdminAnalytics />}
      </div>
    </div>
  );
}

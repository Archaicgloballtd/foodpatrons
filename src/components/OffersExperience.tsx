"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import RestaurantCard from "./RestaurantCard";
import EmptyState from "./EmptyState";

const DISCOUNT_TIERS = [
  { key: 0, label: "Any %" },
  { key: 10, label: "10%+" },
  { key: 20, label: "20%+" },
  { key: 30, label: "30%+" },
  { key: 50, label: "50%+" },
];

export default function OffersExperience({
  restaurants,
  error,
}: {
  restaurants: Restaurant[];
  error: string | null;
}) {
  const [minDiscount, setMinDiscount] = useState(0);
  const [cuisine, setCuisine] = useState("All");

  const offerRestaurants = useMemo(() => restaurants.filter((r) => r.offer), [restaurants]);

  const cuisines = useMemo(() => {
    const set = new Set(offerRestaurants.map((r) => r.cuisine).filter((c): c is string => !!c));
    return ["All", ...Array.from(set).sort()];
  }, [offerRestaurants]);

  const filtered = useMemo(() => {
    return offerRestaurants
      .filter((r) => cuisine === "All" || r.cuisine === cuisine)
      .filter((r) => minDiscount === 0 || (r.offer?.discount_percent ?? 0) >= minDiscount)
      .sort((a, b) => (b.offer?.discount_percent ?? -1) - (a.offer?.discount_percent ?? -1));
  }, [offerRestaurants, cuisine, minDiscount]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Offers</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Live deals and discounts from restaurants across Bangladesh — updated as they come in.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DISCOUNT_TIERS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMinDiscount(t.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                minDiscount === t.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="w-full shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-auto"
        >
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All types" : c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {error && <EmptyState mascot="sad" title="Couldn't load offers" description={error} />}
        {!error && offerRestaurants.length === 0 && (
          <EmptyState
            mascot="search"
            title="No live offers right now"
            description="Check back soon — new deals drop all the time."
          />
        )}
        {!error && offerRestaurants.length > 0 && filtered.length === 0 && (
          <EmptyState
            mascot="search"
            title="No offers match your filters"
            description="Try a lower discount threshold or a different type."
          />
        )}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

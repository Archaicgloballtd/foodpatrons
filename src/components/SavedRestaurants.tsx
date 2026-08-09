"use client";

import { useEffect, useState } from "react";
import { getRestaurants, type Restaurant } from "@/lib/restaurants";
import RestaurantCard from "./RestaurantCard";
import RestaurantCardSkeleton from "./RestaurantCardSkeleton";
import EmptyState from "./EmptyState";

const SAVED_KEY = "fp_saved_restaurant_ids";

export default function SavedRestaurants() {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [saved, setSaved] = useState<Restaurant[]>([]);

  useEffect(() => {
    let savedIds: string[] = [];
    try {
      savedIds = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
    } catch {
      savedIds = [];
    }

    if (savedIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage requires waiting for mount; short-circuits the network fetch when there's nothing saved
      setStatus("done");
      return;
    }

    getRestaurants().then(({ restaurants, error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      setSaved(restaurants.filter((r) => savedIds.includes(r.id)));
      setStatus("done");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
        <RestaurantCardSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return <EmptyState mascot="sad" title="Couldn't load your saved restaurants" description="Please try again shortly." />;
  }

  if (saved.length === 0) {
    return (
      <EmptyState
        mascot="search"
        title="No saved restaurants yet"
        description="Tap the heart icon on any restaurant card to save it here for later."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}

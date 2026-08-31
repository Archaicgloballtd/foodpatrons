"use client";

import { useState, type ReactNode } from "react";
import Hero from "./Hero";
import MakeFoodFriends from "./MakeFoodFriends";
import StatsStrip from "./StatsStrip";
import PopupAd from "./PopupAd";
import type { Restaurant } from "@/lib/restaurants";

export default function HomeExperience({
  restaurants,
  bannerAd,
}: {
  restaurants: Restaurant[];
  bannerAd?: ReactNode;
}) {
  const [, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <>
      <PopupAd />
      <Hero onLocationFound={setUserLocation} restaurants={restaurants} />
      {bannerAd && <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{bannerAd}</div>}
      <MakeFoodFriends />
      <StatsStrip restaurants={restaurants} />
    </>
  );
}

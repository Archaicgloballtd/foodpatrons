"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";

// Leaflet touches `window` at import time, which breaks Next.js's server
// render pass for this "use client" component. Loading it only on the
// client sidesteps that — and as a bonus means no Google Maps API key,
// billing, or referrer allowlist to keep working: OpenStreetMap tiles need
// none of that.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>,
});

export default function RestaurantMap({
  restaurants,
  userLocation,
  fullHeight = false,
  mapHeightClass,
}: {
  restaurants: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  fullHeight?: boolean;
  mapHeightClass?: string;
}) {
  const heightClass = mapHeightClass ?? (fullHeight ? "h-[420px] lg:h-[600px]" : "h-72 sm:h-80");

  const located = restaurants.filter(
    (r): r is Restaurant & { latitude: number; longitude: number } =>
      r.latitude !== null && r.longitude !== null,
  );

  if (located.length === 0) {
    return (
      <div
        className={`flex ${heightClass} flex-col items-center justify-center gap-2 rounded-3xl bg-muted/60 px-6 text-center`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">No locations to show yet</p>
        <p className="text-xs text-muted-foreground">
          Restaurants will appear here once they have a map location on file.
        </p>
      </div>
    );
  }

  return (
    <div className={`${heightClass} overflow-hidden rounded-2xl border border-border`}>
      <LeafletMap restaurants={located} userLocation={userLocation} />
    </div>
  );
}

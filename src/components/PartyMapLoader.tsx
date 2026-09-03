"use client";

import dynamic from "next/dynamic";
import type { PartyWithRestaurant } from "@/lib/parties";

// Leaflet touches `window` at import time — client-only, same reasoning as
// RestaurantMap.tsx's split from LeafletMap.tsx.
const PartyMap = dynamic(() => import("./PartyMap"), {
  ssr: false,
  loading: () => <div className="flex h-72 items-center justify-center rounded-2xl bg-muted/60 text-sm text-muted-foreground sm:h-96">Loading map…</div>,
});

export default function PartyMapLoader({ parties, onChanged }: { parties: PartyWithRestaurant[]; onChanged: () => void }) {
  return <PartyMap parties={parties} onChanged={onChanged} />;
}

"use client";

import { useEffect } from "react";
import { pushRecentId } from "@/lib/personalization";

/** Renders nothing — just remembers this restaurant so the homepage can offer "pick up where you left off". */
export default function TrackRecentlyViewed({ restaurantId }: { restaurantId: string }) {
  useEffect(() => {
    pushRecentId(restaurantId);
  }, [restaurantId]);
  return null;
}

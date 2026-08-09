"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import ExploreExperience from "./ExploreExperience";
import QuickReserveOverlay from "./QuickReserveOverlay";

// The Explore page renders underneath as a familiar, browsable backdrop —
// but landing here jumps straight to "which restaurant, what time" instead
// of making you dig through the grid to find a Reserve button yourself.
export default function ReserveExperience({
  restaurants,
  error,
}: {
  restaurants: Restaurant[];
  error: string | null;
}) {
  const [showReserve, setShowReserve] = useState(true);

  return (
    <>
      <ExploreExperience restaurants={restaurants} error={error} />
      {showReserve && <QuickReserveOverlay restaurants={restaurants} onClose={() => setShowReserve(false)} />}
      {!showReserve && (
        <button
          type="button"
          onClick={() => setShowReserve(true)}
          className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-105 lg:bottom-8"
        >
          <CalendarCheck className="h-4 w-4" />
          Reserve a table
        </button>
      )}
    </>
  );
}

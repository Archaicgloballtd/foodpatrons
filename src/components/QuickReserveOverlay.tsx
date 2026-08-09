"use client";

import { useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import Modal from "./Modal";
import ReservationModal from "./ReservationModal";

export default function QuickReserveOverlay({
  restaurants,
  onClose,
}: {
  restaurants: Restaurant[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants.slice(0, 6);
    return restaurants
      .filter((r) => [r.name, r.cuisine, r.area].some((field) => field?.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [restaurants, query]);

  if (selected) {
    return (
      <ReservationModal
        restaurantId={selected.id}
        restaurantName={selected.name}
        restaurantImage={selected.cover_image_url ?? selected.image_url}
        restaurantAddress={selected.address}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal title="Reserve a table" onClose={onClose}>
      <p className="mb-3 text-sm text-muted-foreground">Which restaurant would you like to book?</p>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, cuisine, or area"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <div className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
        {matches.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No restaurants match &quot;{query}&quot;.</p>
        )}
        {matches.map((r) => {
          const image = r.cover_image_url ?? r.image_url;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotlinked URLs, no domain allowlist for MVP
                  <img src={image} alt={r.name} className="h-full w-full object-cover" />
                ) : (
                  <UtensilsCrossed className="h-4 w-4 text-primary/50" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[r.cuisine, r.area].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

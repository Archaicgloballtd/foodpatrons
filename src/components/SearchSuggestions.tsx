"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";

type SuggestibleRestaurant = { id: string; name: string; area: string | null; cuisine: string | null };

/** Dropdown of matching restaurant names, narrowing as you type. Click a
 * result to jump straight to it; falls through to a normal text search
 * (via onSubmitQuery) if nothing matches or the user just wants to browse
 * a broader term like a cuisine or area. */
export default function SearchSuggestions({
  query,
  restaurants,
  visible,
  onSelect,
}: {
  query: string;
  restaurants: SuggestibleRestaurant[];
  visible: boolean;
  onSelect?: () => void;
}) {
  const router = useRouter();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return restaurants
      .filter((r) => r.name.toLowerCase().includes(q) || r.area?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q))
      .sort((a, b) => {
        // Names starting with the query rank above names that merely contain it.
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [query, restaurants]);

  if (!visible || !query.trim() || matches.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
      {matches.map((r) => (
        <button
          key={r.id}
          type="button"
          // onMouseDown (not onClick) fires before the input's onBlur closes
          // this dropdown, so the navigation actually happens.
          onMouseDown={() => {
            onSelect?.();
            router.push(`/restaurant/${r.id}`);
          }}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">{r.name}</span>
          {(r.area || r.cuisine) && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              {r.area && <MapPin className="h-3 w-3" />}
              {[r.cuisine, r.area].filter(Boolean).join(" · ")}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

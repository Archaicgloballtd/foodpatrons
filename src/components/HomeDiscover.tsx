"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Compass, Heart, History, MapPin, Utensils } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { useSession } from "@/lib/auth";
import {
  DAYPART_COPY,
  getDayPart,
  normalizeArea,
  readRecentIds,
  readSavedIds,
  type DayPart,
} from "@/lib/personalization";
import CuisineArt from "./CuisineArt";
import MeetupsStrip from "./MeetupsStrip";

function Tile({ restaurant }: { restaurant: Restaurant }) {
  const image = restaurant.cover_image_url ?? restaurant.image_url;
  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-border bg-card p-2.5 transition-colors hover:border-primary"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- real restaurant photo, no domain allowlist for MVP
          <img src={image} alt={restaurant.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <CuisineArt cuisine={restaurant.cuisine} name={restaurant.name} compact />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{restaurant.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[restaurant.cuisine, normalizeArea(restaurant.area)].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export default function HomeDiscover({ restaurants }: { restaurants: Restaurant[] }) {
  const { user, profile } = useSession();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  // Everything below that depends on the visitor's clock or browser storage
  // is read after mount — the server render stays neutral so it never
  // mismatches what the browser then shows.
  const [dayPart, setDayPart] = useState<DayPart | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock and localStorage only exist in the browser, so this must run after mount
    setDayPart(getDayPart());
    setRecentIds(readRecentIds());
    setSavedIds(readSavedIds());
  }, []);

  const byId = useMemo(() => new Map(restaurants.map((r) => [r.id, r])), [restaurants]);
  const recent = recentIds.map((id) => byId.get(id)).filter((r): r is Restaurant => !!r);
  const saved = savedIds.map((id) => byId.get(id)).filter((r): r is Restaurant => !!r);

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of restaurants) {
      const area = normalizeArea(r.area);
      if (area) counts.set(area, (counts.get(area) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [restaurants]);

  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of restaurants) {
      const first = r.cuisine?.split(/[,&/]/)[0]?.trim();
      if (first && first.toLowerCase() !== "restaurant") counts.set(first, (counts.get(first) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [restaurants]);

  const copy = dayPart ? DAYPART_COPY[dayPart] : null;

  return (
    <section className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      {/* Right-now context: the time, the visitor's name if known, and one-tap ways in */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-orange-50 via-white to-purple-50/60 p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Clock className="h-3.5 w-3.5" />
          {copy ? copy.greeting : "Hungry?"}
          {user && firstName ? `, ${firstName}` : ""}
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
          {copy ? copy.prompt : "Find a table, a deal, or someone to eat with."}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(copy?.chips ?? []).map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
            >
              {chip.label}
            </Link>
          ))}
          <Link
            href="/explore"
            className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-transform hover:bg-muted active:scale-95"
          >
            <MapPin className="h-4 w-4 text-primary" />
            Near me
          </Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Pick up where you left off
          </h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((r) => (
              <Tile key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Heart className="h-4 w-4 text-primary" />
              Your saved spots
            </h2>
            <Link href="/saved" className="text-sm font-semibold text-primary hover:underline">
              See all {saved.length}
            </Link>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {saved.slice(0, 8).map((r) => (
              <Tile key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      )}

      <MeetupsStrip />

      {areas.length > 0 && (
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <Compass className="h-4 w-4 text-primary" />
            Browse by area
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {areas.map(([area, count]) => (
              <Link
                key={area}
                href={`/explore?q=${encodeURIComponent(area)}`}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <p className="font-bold text-foreground">{area}</p>
                <p className="text-xs text-muted-foreground">
                  {count} place{count === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {cuisines.length > 0 && (
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <Utensils className="h-4 w-4 text-primary" />
            What are you craving?
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cuisines.map(([cuisine, count]) => (
              <Link
                key={cuisine}
                href={`/explore?q=${encodeURIComponent(cuisine)}`}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {cuisine} <span className="text-muted-foreground">· {count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

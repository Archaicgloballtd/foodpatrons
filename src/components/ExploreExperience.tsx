"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { MapPin, Search, Sparkles, Star, ArrowDownAZ } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { distanceKm } from "@/lib/restaurants";
import { categories, restaurantMatchesCategory } from "@/lib/categories";
import RestaurantCard from "./RestaurantCard";
import RestaurantMap from "./RestaurantMap";
import EmptyState from "./EmptyState";
import LazyMount from "./LazyMount";
import MeetupsStrip from "./MeetupsStrip";
import SearchSuggestions from "./SearchSuggestions";

type LocationStatus = "idle" | "loading" | "success" | "error";
type SortOption = "recommended" | "rating" | "distance" | "name";

const PAGE_SIZE = 24;

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Sparkles }[] = [
  { value: "recommended", label: "Recommended", icon: Sparkles },
  { value: "distance", label: "Nearest", icon: MapPin },
  { value: "rating", label: "Top rated", icon: Star },
  { value: "name", label: "A–Z", icon: ArrowDownAZ },
];

export default function ExploreExperience({
  restaurants,
  error,
  topAd,
  sidebarAd,
  cardAd,
  initialCategory = "All",
  initialQuery = "",
}: {
  restaurants: Restaurant[];
  error: string | null;
  topAd?: ReactNode;
  sidebarAd?: ReactNode;
  cardAd?: ReactNode;
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const category = categoryOverride ?? initialCategory;
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const filtered = useMemo(() => {
    let list =
      category === "All" ? restaurants : restaurants.filter((r) => restaurantMatchesCategory(r, category));

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.name, r.cuisine, r.area, r.address].some((field) => field?.toLowerCase().includes(q)),
      );
    }

    const sorted = [...list];

    if (sortBy === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "distance" && userLocation) {
      sorted.sort((a, b) => {
        if (a.latitude === null || a.longitude === null) return 1;
        if (b.latitude === null || b.longitude === null) return -1;
        const distA = distanceKm(userLocation, { lat: a.latitude, lng: a.longitude });
        const distB = distanceKm(userLocation, { lat: b.latitude, lng: b.longitude });
        return distA - distB;
      });
    } else if (sortBy === "recommended") {
      // Admin-featured spots always lead, whatever category is selected.
      // Behind those, nearest-to-you wins once we know where "you" is —
      // otherwise it falls back to the rating-sorted order from the DB.
      sorted.sort((a, b) => {
        const featuredDiff = (a.is_featured ? 0 : 1) - (b.is_featured ? 0 : 1);
        if (featuredDiff !== 0) return featuredDiff;
        if (!userLocation) return 0;
        if (a.latitude === null || a.longitude === null) return 1;
        if (b.latitude === null || b.longitude === null) return -1;
        const distA = distanceKm(userLocation, { lat: a.latitude, lng: a.longitude });
        const distB = distanceKm(userLocation, { lat: b.latitude, lng: b.longitude });
        return distA - distB;
      });
    }

    return sorted;
  }, [restaurants, category, userLocation, query, sortBy]);

  function getDistance(r: Restaurant): number | undefined {
    if (!userLocation || r.latitude === null || r.longitude === null) return undefined;
    return distanceKm(userLocation, { lat: r.latitude, lng: r.longitude });
  }

  function handleSortChange(value: SortOption) {
    setSortBy(value);
    setVisibleCount(PAGE_SIZE);
    if (value === "distance" && !userLocation) handleUseMyLocation();
  }

  function handleCategoryChange(key: string) {
    setCategoryOverride(key);
    setVisibleCount(PAGE_SIZE);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus("success");
      },
      () => setLocationStatus("error"),
      { timeout: 10000 },
    );
  }

  useEffect(() => {
    // Ask for location as soon as the page opens so "near you" ordering and
    // the map can center immediately, without waiting for a button click.
    handleUseMyLocation();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky top bar: the primary, always-visible way to narrow results */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locationStatus === "loading"}
            className="flex items-center justify-center gap-1.5 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" />
            {locationStatus === "loading"
              ? "Locating…"
              : locationStatus === "success"
                ? "Using your location"
                : "Use my location"}
          </button>
          <div className="relative flex flex-1 items-center gap-2 rounded-full border border-border bg-white px-3 py-2 focus-within:border-primary">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setSuggestionsOpen(false)}
              placeholder="Search food, restaurant, offer, or area"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label="Clear search"
                className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
            <SearchSuggestions query={query} restaurants={restaurants} visible={suggestionsOpen} onSelect={() => setSuggestionsOpen(false)} />
          </div>
        </div>
        {locationStatus === "error" && (
          <p className="mx-auto mt-2 max-w-6xl text-xs font-medium text-destructive">
            Couldn&apos;t access your location. Check your browser permissions.
          </p>
        )}

        {/* Filter chips */}
        <div className="mx-auto mt-3 flex max-w-6xl gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => handleCategoryChange("All")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              category === "All" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-accent/20"
            }`}
          >
            All
          </button>
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryChange(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                category === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-accent/20"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6">
        {topAd && <div className="mt-4">{topAd}</div>}

        {/* Map — comes right after the search bar so you can see what's around
            before scrolling into the list. Still lazy-mounted so the Leaflet
            chunk and marker icons don't load until this section is reached. */}
        <div className="mt-4">
          <LazyMount
            placeholder={
              <div className="flex h-80 items-center justify-center rounded-2xl bg-muted/60 text-sm text-muted-foreground sm:h-[420px]">
                Loading map…
              </div>
            }
          >
            <RestaurantMap restaurants={filtered} userLocation={userLocation} mapHeightClass="h-80 sm:h-[420px]" />
          </LazyMount>
        </div>

        <MeetupsStrip />

        {/* Results — browse and pick a restaurant to reserve */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground">
            {filtered.length} restaurant{filtered.length === 1 ? "" : "s"}
            {category !== "All" ? ` · ${category}` : ""}
          </h2>

          {/* Sort tiles — tap to arrange, instead of a dropdown */}
          <div className="mt-3 mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSortChange(opt.value)}
                aria-pressed={sortBy === opt.value}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  sortBy === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-foreground/70 hover:bg-muted"
                }`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {error && <EmptyState mascot="sad" title="Couldn't load restaurants" description={error} />}
          {!error && filtered.length === 0 && (
            <EmptyState
              mascot="search"
              title={query ? `No matches for "${query}"` : "No restaurants match this filter"}
              description={query ? "Try a different search term or category." : "Try a different category."}
            />
          )}
          {filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(0, visibleCount).map((restaurant, i) => (
                  <Fragment key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} distanceKm={getDistance(restaurant)} />
                    {cardAd && i === 2 && cardAd}
                  </Fragment>
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="rounded-full border border-border bg-white px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Show more ({filtered.length - visibleCount} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {sidebarAd && <div className="mt-6">{sidebarAd}</div>}
      </div>
    </div>
  );
}

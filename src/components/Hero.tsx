"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { MapPin, Search, Sparkles, Compass } from "lucide-react";
import CategoryChips from "./CategoryChips";
import SearchSuggestions from "./SearchSuggestions";
import { useSession } from "@/lib/auth";
import type { Restaurant } from "@/lib/restaurants";

type LocationStatus = "idle" | "loading" | "success" | "error";

// Keeps white text readable on top of the photo without needing a heavy
// overlay (which is what hid the faces before).
const TEXT_SHADOW = "[text-shadow:0_1px_10px_rgba(10,15,45,0.55)]";

export default function Hero({
  onLocationFound,
  restaurants,
}: {
  onLocationFound: (location: { lat: number; lng: number }) => void;
  restaurants: Restaurant[];
}) {
  const router = useRouter();
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { user, profile } = useSession();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationFound({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("success");
        // Explore auto-detects location on its own mount and sorts nearby —
        // permission is already granted at this point so that second
        // request resolves instantly with no new browser prompt.
        router.push("/explore");
      },
      () => setLocationStatus("error"),
      { timeout: 10000 },
    );
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  }

  return (
    // Generous top padding on purpose: the group photo's faces sit at the top
    // of the backdrop, and the heading starts below them instead of over them.
    <section className="relative overflow-hidden border-b border-border bg-secondary px-4 pb-0 pt-44 text-center sm:px-6 sm:pt-52">
      {/* Brand poster as the hero backdrop. The file is pre-cropped to just
          the group photo (the poster's own headline and app-store badges are
          cut off) so it stays clean at any screen width. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url(/brand/hero-people.jpg)", backgroundPosition: "center 6%" }}
      />
      {/* Light at the top so the faces read clearly, deepening toward the
          text and search bar so they stay legible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-secondary/30 to-secondary/70"
      />

      <div className="relative">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-secondary shadow-sm ring-1 ring-border backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {user ? `Welcome back${firstName ? `, ${firstName}` : ""}!` : "Bangladesh's liveliest food & events guide"}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className={`mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl ${TEXT_SHADOW}`}
        >
          Where do you want to{" "}
          {/* Same yellow as the poster's own headline — the brand orange
              vanishes into the poster's orange backdrop. */}
          <span className="text-brand-sunny">eat</span>{" "}
          today?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className={`mx-auto mt-3 max-w-xl text-base text-white sm:mt-4 sm:text-lg ${TEXT_SHADOW}`}
        >
          Discover nearby restaurants, live offers, and tables in a few clicks.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="relative mx-auto mt-7 flex max-w-lg items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-4 shadow-md shadow-primary/5"
          onSubmit={handleSearchSubmit}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setSuggestionsOpen(false)}
            placeholder="Search food, restaurant, offer, or area"
            className="w-full flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
          >
            Search
          </button>
          <SearchSuggestions
            query={searchQuery}
            restaurants={restaurants}
            visible={suggestionsOpen}
            onSelect={() => setSuggestionsOpen(false)}
          />
        </motion.form>

        {/* Use my location + Explore offers */}
        <div className="mx-auto mt-3 flex max-w-lg flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locationStatus === "loading"}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition-transform hover:bg-muted active:scale-95 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4 text-primary" />
            {locationStatus === "loading" ? "Locating…" : "Use my location"}
          </button>
          <Link
            href="/offers"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-sm ring-1 ring-white/40 transition-transform hover:bg-secondary/90 active:scale-95"
          >
            <Compass className="h-4 w-4" />
            Explore offers
          </Link>
        </div>

        {locationStatus === "success" && (
          <p className={`mt-2 text-xs font-semibold text-emerald-200 ${TEXT_SHADOW}`}>
            Location found — taking you to restaurants near you…
          </p>
        )}
        {locationStatus === "error" && (
          <p className={`mt-2 text-xs font-semibold text-red-200 ${TEXT_SHADOW}`}>
            Couldn&apos;t access your location. Check your browser permissions.
          </p>
        )}

        {/* Food-type chips — each opens Explore filtered to that food, and
            Explore orders results nearest-first once it knows where you are. */}
        <div className="mx-auto mt-7 max-w-4xl pb-12 sm:pb-16">
          <CategoryChips wrap />
        </div>
      </div>
    </section>
  );
}

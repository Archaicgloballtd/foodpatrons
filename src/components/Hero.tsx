"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react";
import { MapPin, Search, Sparkles, Compass } from "lucide-react";
import CategoryChips from "./CategoryChips";
import { useSession } from "@/lib/auth";

function FloatingFood({
  src,
  alt,
  className,
  sizeClass,
  animate,
  transition,
}: {
  src: string;
  alt: string;
  className: string;
  sizeClass: string;
  animate: TargetAndTransition | Record<string, never>;
  transition: Transition;
}) {
  return (
    <motion.div className={className} animate={animate} transition={transition}>
      <div className={`${sizeClass} aspect-square overflow-hidden rounded-full shadow-xl shadow-black/10 ring-4 ring-white/80`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local decorative sticker, no next/image benefit */}
        <img src={src} alt={alt} className="h-full w-full scale-[1.35] object-cover" />
      </div>
    </motion.div>
  );
}

type LocationStatus = "idle" | "loading" | "success" | "error";

export default function Hero({
  onLocationFound,
}: {
  onLocationFound: (location: { lat: number; lng: number }) => void;
}) {
  const router = useRouter();
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();
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

  const floatTransition = (duration: number, delay = 0) =>
    shouldReduceMotion
      ? { duration: 0 }
      : { duration, delay, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-orange-50 via-white to-purple-50/60 px-4 pb-0 pt-14 text-center sm:px-6 sm:pt-20">
      {/* Decorative floating shapes — bigger and more colorful */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-purple/25 blur-3xl"
          animate={shouldReduceMotion ? {} : { y: [0, -28, 0], x: [0, 18, 0] }}
          transition={floatTransition(8)}
        />
        <motion.div
          className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
          animate={shouldReduceMotion ? {} : { y: [0, 24, 0], x: [0, -14, 0] }}
          transition={floatTransition(9, 0.5)}
        />
        <motion.div
          className="absolute -bottom-10 left-1/4 h-64 w-64 rounded-full bg-brand-turquoise/25 blur-3xl"
          animate={shouldReduceMotion ? {} : { y: [0, -22, 0] }}
          transition={floatTransition(7, 1)}
        />
        <motion.div
          className="absolute right-1/4 top-0 h-40 w-40 rounded-full bg-brand-sunny/30 blur-3xl"
          animate={shouldReduceMotion ? {} : { y: [0, 18, 0] }}
          transition={floatTransition(6, 0.3)}
        />

        {/* Floating food stickers — bigger, brought in closer to center, hidden on small screens to keep mobile text-focused */}
        <FloatingFood
          src="/canva/food-burger.png"
          alt=""
          sizeClass="w-24 sm:w-32 lg:w-36"
          className="absolute left-[14%] top-[8%] hidden opacity-95 sm:block"
          animate={shouldReduceMotion ? {} : { y: [0, -22, 0], rotate: [-9, 9, -9], scale: [1, 1.05, 1] }}
          transition={floatTransition(6.5)}
        />
        <FloatingFood
          src="/canva/food-pizza.png"
          alt=""
          sizeClass="w-24 sm:w-28 lg:w-32"
          className="absolute right-[15%] top-[4%] hidden opacity-95 sm:block"
          animate={shouldReduceMotion ? {} : { y: [0, 20, 0], rotate: [11, -11, 11], scale: [1, 1.05, 1] }}
          transition={floatTransition(7.5, 0.4)}
        />
        <FloatingFood
          src="/canva/food-drink.png"
          alt=""
          sizeClass="w-20 sm:w-28 lg:w-32"
          className="absolute left-[17%] top-[46%] hidden opacity-95 md:block"
          animate={shouldReduceMotion ? {} : { y: [0, -18, 0], rotate: [-7, 7, -7], scale: [1, 1.05, 1] }}
          transition={floatTransition(6, 0.8)}
        />
      </div>

      <div className="relative">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-secondary shadow-sm ring-1 ring-border backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {user ? `Welcome back${firstName ? `, ${firstName}` : ""}!` : "Bangladesh's liveliest food & events guide"}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl"
        >
          Where do you want to{" "}
          <span className="bg-gradient-to-r from-primary via-orange-500 to-brand-coral bg-clip-text text-transparent">
            eat
          </span>{" "}
          today?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:mt-4 sm:text-lg"
        >
          Discover nearby restaurants, live offers, and tables in a few clicks.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="mx-auto mt-7 flex max-w-lg items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-4 shadow-md shadow-primary/5"
          onSubmit={handleSearchSubmit}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, restaurant, offer, or area"
            className="w-full flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95"
          >
            Search
          </button>
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
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-sm transition-transform hover:bg-secondary/90 active:scale-95"
          >
            <Compass className="h-4 w-4" />
            Explore offers
          </Link>
        </div>

        {locationStatus === "success" && (
          <p className="mt-2 text-xs font-medium text-secondary">
            Location found — sorting nearby picks below.
          </p>
        )}
        {locationStatus === "error" && (
          <p className="mt-2 text-xs font-medium text-destructive">
            Couldn&apos;t access your location. Check your browser permissions.
          </p>
        )}

        {/* Category chips */}
        <div className="mx-auto mt-7 max-w-4xl pb-12 sm:pb-16">
          <CategoryChips />
        </div>
      </div>
    </section>
  );
}

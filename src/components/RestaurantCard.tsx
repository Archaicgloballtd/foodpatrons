"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, CalendarCheck, Tag, UtensilsCrossed, Heart, Share2, Check } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RatingBadge from "./RatingBadge";
import BudgetBadge from "./BudgetBadge";
import ReservationModal from "./ReservationModal";
import ClaimOfferModal from "./ClaimOfferModal";

const SAVED_KEY = "fp_saved_restaurant_ids";

function readSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function RestaurantCard({
  restaurant,
  distanceKm,
  reason,
}: {
  restaurant: Restaurant;
  distanceKm?: number;
  reason?: string;
}) {
  const router = useRouter();
  const [showReserve, setShowReserve] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [justShared, setJustShared] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [burst, setBurst] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const image = restaurant.cover_image_url ?? restaurant.image_url;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so saved state must be read after mount to avoid a hydration mismatch
    setIsSaved(readSavedIds().includes(restaurant.id));
  }, [restaurant.id]);

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ids = readSavedIds();
    const next = ids.includes(restaurant.id)
      ? ids.filter((id) => id !== restaurant.id)
      : [...ids, restaurant.id];
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setIsSaved(!isSaved);
  }

  // Instagram-style double-tap-to-save on the photo. A single click there
  // still opens the profile, just delayed enough (250ms) to tell a double
  // click apart — the name/cuisine link below stays instant for anyone who
  // doesn't care about the gesture.
  function handleImageClick(e: React.MouseEvent) {
    e.preventDefault();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      const ids = readSavedIds();
      if (!ids.includes(restaurant.id)) {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify([...ids, restaurant.id]));
        setIsSaved(true);
      }
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        router.push(`/restaurant/${restaurant.id}`);
      }, 250);
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/restaurant/${restaurant.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant.name, url });
      } catch {
        // user cancelled the native share sheet — no action needed
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setJustShared(true);
    setTimeout(() => setJustShared(false), 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="relative">
        <div onClick={handleImageClick} className="group block cursor-pointer">
          <div className="relative aspect-[4/3] overflow-hidden">
            {image ? (
              <>
                {!imgLoaded && <div className="skeleton-shimmer absolute inset-0 bg-muted" />}
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary hotlinked URLs, no domain allowlist for MVP */}
                <img
                  src={image}
                  alt={restaurant.name}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-110 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted text-5xl">
                <UtensilsCrossed className="h-10 w-10 text-primary/50" />
              </div>
            )}
            <Badge
              className={`absolute left-2 top-2 ${
                restaurant.is_open ? "bg-secondary text-secondary-foreground" : "bg-foreground/70 text-white"
              }`}
            >
              {restaurant.is_open ? "Open now" : "Closed"}
            </Badge>
            {restaurant.offer && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
                <Badge className="gap-1 bg-accent text-accent-foreground">
                  <Tag className="h-3 w-3" />
                  {restaurant.offer.discount_label ??
                    (restaurant.offer.discount_percent
                      ? `${restaurant.offer.discount_percent}% off`
                      : "Offer")}
                </Badge>
              </div>
            )}
            <AnimatePresence>
              {burst && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <Heart className="h-16 w-16 fill-white text-white drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <motion.button
            type="button"
            onClick={toggleSave}
            whileTap={{ scale: 0.85 }}
            aria-label={isSaved ? "Remove from saved" : "Save restaurant"}
            aria-pressed={isSaved}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur hover:scale-105"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isSaved ? "saved" : "unsaved"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center justify-center"
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-foreground/70"}`} />
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share restaurant"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
          >
            {justShared ? (
              <Check className="h-4 w-4 text-secondary" />
            ) : (
              <Share2 className="h-3.5 w-3.5 text-foreground/70" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/restaurant/${restaurant.id}`} className="block">
          <h3 className="truncate text-base font-bold text-foreground">{restaurant.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <RatingBadge rating={restaurant.rating} />
            {restaurant.cuisine && (
              <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-semibold text-brand-purple">
                {restaurant.cuisine}
              </span>
            )}
            <BudgetBadge priceRange={restaurant.price_range} />
          </div>
        </Link>

        <div className="mt-2.5 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate">{restaurant.address}</span>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {restaurant.is_open ? "Open now" : "Closed"}
          </span>
          {distanceKm !== undefined && (
            <span className="shrink-0 font-semibold text-foreground">{distanceKm.toFixed(1)} km away</span>
          )}
        </div>

        {restaurant.offer && (
          <p className="mt-2 truncate text-xs font-semibold text-primary">{restaurant.offer.title}</p>
        )}
        {reason && <p className="mt-2 text-xs italic text-muted-foreground">✨ {reason}</p>}

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowReserve(true)}
            className="h-10 flex-1 rounded-full border-primary text-primary transition-transform hover:bg-primary/10 active:scale-95"
          >
            <CalendarCheck className="h-4 w-4" />
            Reserve
          </Button>
          {restaurant.offer && (
            <Button
              type="button"
              onClick={() => setShowClaim(true)}
              className="h-10 flex-1 rounded-full bg-secondary text-secondary-foreground transition-transform hover:bg-secondary/90 active:scale-95"
            >
              <Tag className="h-4 w-4" />
              Claim Offer
            </Button>
          )}
        </div>
      </div>

      {showReserve && (
        <ReservationModal
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantImage={image}
          restaurantAddress={restaurant.address}
          onClose={() => setShowReserve(false)}
        />
      )}
      {showClaim && restaurant.offer && (
        <ClaimOfferModal
          offerId={restaurant.offer.id}
          restaurantId={restaurant.id}
          offerTitle={restaurant.offer.title}
          offerEndsAt={restaurant.offer.ends_at}
          onClose={() => setShowClaim(false)}
        />
      )}
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Tag,
  CalendarCheck,
  UtensilsCrossed,
} from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RatingBadge from "./RatingBadge";
import BudgetBadge from "./BudgetBadge";
import RestaurantMap from "./RestaurantMap";
import ReservationModal from "./ReservationModal";
import ClaimOfferModal from "./ClaimOfferModal";
import RestaurantReviews from "./RestaurantReviews";
import RestaurantMenu from "./RestaurantMenu";
import RestaurantMeetups from "./RestaurantMeetups";

export default function RestaurantProfile({ restaurant }: { restaurant: Restaurant }) {
  const [showReserve, setShowReserve] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const image = restaurant.cover_image_url ?? restaurant.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-4xl px-4 py-6 sm:px-6"
    >
      <div className="relative h-56 overflow-hidden rounded-2xl border border-border sm:h-72">
        {image ? (
          <>
            {!imgLoaded && <div className="skeleton-shimmer absolute inset-0 bg-muted" />}
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary hotlinked URLs, no domain allowlist for MVP */}
            <img
              src={image}
              alt={restaurant.name}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <UtensilsCrossed className="h-14 w-14 text-primary/50" />
          </div>
        )}
        <Badge
          className={`absolute left-3 top-3 ${
            restaurant.is_open ? "bg-secondary text-secondary-foreground" : "bg-foreground/70 text-white"
          }`}
        >
          {restaurant.is_open ? "Open now" : "Closed"}
        </Badge>
        {restaurant.offer && (
          <Badge className="absolute right-3 top-3 gap-1 bg-accent text-accent-foreground">
            <Tag className="h-3 w-3" />
            {restaurant.offer.discount_label ??
              (restaurant.offer.discount_percent ? `${restaurant.offer.discount_percent}% off` : "Offer")}
          </Badge>
        )}
      </div>

      <div className="mt-5">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{restaurant.name}</h1>
        <p className="mt-1 text-muted-foreground">{restaurant.cuisine ?? "Cuisine unknown"}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <RatingBadge rating={restaurant.rating} size="md" />
          <BudgetBadge priceRange={restaurant.price_range} size="md" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {restaurant.area ?? restaurant.address ?? "—"}
          </span>
          {restaurant.opening_hours && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {restaurant.opening_hours}
            </span>
          )}
        </div>

        {restaurant.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{restaurant.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
          {restaurant.whatsapp && (
            <a
              href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>

        {restaurant.offer && (
          <div className="mt-5 rounded-2xl bg-accent/15 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              {restaurant.offer.title}
            </p>
            {restaurant.offer.description && (
              <p className="mt-1 text-sm text-muted-foreground">{restaurant.offer.description}</p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            onClick={() => setShowReserve(true)}
            className="h-12 flex-1 rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <CalendarCheck className="h-5 w-5" />
            Reserve a table
          </Button>
          {restaurant.offer && (
            <Button
              type="button"
              onClick={() => setShowClaim(true)}
              className="h-12 flex-1 rounded-full bg-secondary text-base font-semibold text-secondary-foreground hover:bg-secondary/90"
            >
              <Tag className="h-5 w-5" />
              Claim offer
            </Button>
          )}
        </div>

        {(restaurant.latitude !== null || restaurant.longitude !== null) && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Location</h2>
            <RestaurantMap restaurants={[restaurant]} mapHeightClass="h-64" />
          </div>
        )}

        <RestaurantMenu restaurantId={restaurant.id} />

        <RestaurantMeetups restaurantId={restaurant.id} />

        <RestaurantReviews restaurantId={restaurant.id} />
      </div>

      {showReserve && (
        <ReservationModal
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantImage={restaurant.cover_image_url ?? restaurant.image_url}
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

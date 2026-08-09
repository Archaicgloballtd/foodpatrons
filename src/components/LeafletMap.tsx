"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Clock, Tag, ArrowRight, UtensilsCrossed } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { distanceKm } from "@/lib/restaurants";
import RatingBadge from "./RatingBadge";
import ReservationModal from "./ReservationModal";
import ClaimOfferModal from "./ClaimOfferModal";

const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 }; // Dhaka, Bangladesh fallback

// Consistent, deterministic color per cuisine/category so the same category
// always gets the same marker color across the map.
const CATEGORY_COLORS = ["#F97316", "#8B5CF6", "#14B8A6", "#FF6B6B", "#EAB308", "#1B2560"];

function colorForCuisine(cuisine: string | null): string {
  if (!cuisine) return CATEGORY_COLORS[0];
  let hash = 0;
  for (let i = 0; i < cuisine.length; i++) hash = (hash * 31 + cuisine.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

function pinIcon(color: string): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="5.5" fill="white"/></svg>`;
  return L.icon({
    iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

const USER_LOCATION_ICON = L.icon({
  iconUrl:
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="#22C55E" stroke="white" stroke-width="3"/></svg>',
    ),
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Pans the existing map instance instead of tearing it down and recreating
// it, which is what happens if center were fed through a changing `key`.
function MapCenterController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // center is a fresh object every render; lat/lng are the real dependency values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

type LocatedRestaurant = Restaurant & { latitude: number; longitude: number };

export default function LeafletMap({
  restaurants,
  userLocation,
}: {
  restaurants: LocatedRestaurant[];
  userLocation?: { lat: number; lng: number } | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReserve, setShowReserve] = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const selected = restaurants.find((r) => r.id === selectedId) ?? null;

  const averageCenter =
    restaurants.length > 0
      ? {
          lat: restaurants.reduce((sum, r) => sum + r.latitude, 0) / restaurants.length,
          lng: restaurants.reduce((sum, r) => sum + r.longitude, 0) / restaurants.length,
        }
      : DEFAULT_CENTER;

  const center = userLocation ?? averageCenter;
  const zoom = userLocation ? 14 : 13;

  return (
    <>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterController center={center} zoom={zoom} />

        {restaurants.map((restaurant) => {
          const image = restaurant.cover_image_url ?? restaurant.image_url;
          const distance = userLocation
            ? distanceKm(userLocation, { lat: restaurant.latitude, lng: restaurant.longitude })
            : undefined;

          return (
            <Marker
              key={restaurant.id}
              position={[restaurant.latitude, restaurant.longitude]}
              icon={pinIcon(colorForCuisine(restaurant.cuisine))}
              eventHandlers={{ click: () => setSelectedId(restaurant.id) }}
            >
              <Popup minWidth={240} maxWidth={260}>
                <div className="w-full">
                  <div className="-mx-3.5 -mt-3.5 mb-2 h-24 w-[calc(100%+1.75rem)] overflow-hidden bg-zinc-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotlinked URLs, no domain allowlist for MVP
                      <img src={image} alt={restaurant.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UtensilsCrossed className="h-7 w-7 text-zinc-300" />
                      </div>
                    )}
                  </div>

                  <Link href={`/restaurant/${restaurant.id}`} className="font-bold leading-snug text-zinc-900 hover:underline">
                    {restaurant.name}
                  </Link>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <RatingBadge rating={restaurant.rating} />
                    <span className="text-xs text-zinc-500">{restaurant.cuisine ?? "—"}</span>
                    {restaurant.price_range && <span className="text-xs text-zinc-500">· {restaurant.price_range}</span>}
                  </div>

                  {restaurant.address && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-zinc-600">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="line-clamp-2">{restaurant.address}</span>
                    </p>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        restaurant.is_open ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {restaurant.is_open ? "Open now" : "Closed"}
                    </span>
                    {distance !== undefined && (
                      <span className="text-[10px] font-medium text-zinc-500">{distance.toFixed(1)} km away</span>
                    )}
                  </div>

                  {restaurant.offer && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#F97316]">
                      <Tag className="h-3 w-3" />
                      {restaurant.offer.title}
                    </p>
                  )}

                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(restaurant.id);
                        setShowReserve(true);
                      }}
                      className="flex-1 rounded-full border border-[#F97316] px-2 py-1 text-[11px] font-semibold text-[#F97316] hover:bg-orange-50"
                    >
                      Reserve
                    </button>
                    {restaurant.offer && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(restaurant.id);
                          setShowClaim(true);
                        }}
                        className="flex-1 rounded-full bg-[#FACC15] px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-[#eab308]"
                      >
                        Claim
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#1B2560] hover:underline"
                  >
                    View details &amp; reviews
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_LOCATION_ICON}>
            <Popup>Your location</Popup>
          </Marker>
        )}
      </MapContainer>

      {selected && showReserve && (
        <ReservationModal
          restaurantId={selected.id}
          restaurantName={selected.name}
          restaurantImage={selected.cover_image_url ?? selected.image_url}
          restaurantAddress={selected.address}
          onClose={() => setShowReserve(false)}
        />
      )}
      {selected?.offer && showClaim && (
        <ClaimOfferModal
          offerId={selected.offer.id}
          restaurantId={selected.id}
          offerTitle={selected.offer.title}
          offerEndsAt={selected.offer.ends_at}
          onClose={() => setShowClaim(false)}
        />
      )}
    </>
  );
}

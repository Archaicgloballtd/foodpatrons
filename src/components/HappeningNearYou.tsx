"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import RestaurantCard from "./RestaurantCard";
import EmptyState from "./EmptyState";

export default function HappeningNearYou({ restaurants }: { restaurants: Restaurant[] }) {
  const withOffers = restaurants.filter((r) => r.offer);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Happening near you</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Live offers, right now.</p>
      </motion.div>

      {withOffers.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Flame}
            title="No live offers right now"
            description="Check back soon — new deals drop all the time."
          />
        </div>
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {withOffers.map((restaurant) => (
            <div key={restaurant.id} className="w-72 shrink-0">
              <RestaurantCard restaurant={restaurant} />
            </div>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

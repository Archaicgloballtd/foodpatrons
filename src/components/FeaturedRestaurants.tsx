"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import RestaurantCard from "./RestaurantCard";
import EmptyState from "./EmptyState";

export default function FeaturedRestaurants({ restaurants }: { restaurants: Restaurant[] }) {
  const featured = restaurants.filter((r) => r.is_featured);
  const shown = featured.length > 0 ? featured : restaurants.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-turquoise/[0.06] to-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Featured restaurants</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {featured.length > 0 ? "Hand-picked by our team." : "Top-rated picks to get you started."}
        </p>
      </motion.div>

      {shown.length === 0 ? (
        <div className="mt-4">
          <EmptyState mascot="search" title="No restaurants yet" description="Check back soon." />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

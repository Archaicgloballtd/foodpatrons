import type { Restaurant } from "@/lib/restaurants";
import RestaurantCard from "./RestaurantCard";

/** Keeps someone browsing after one restaurant page instead of bouncing. */
export default function SimilarRestaurants({ heading, restaurants }: { heading: string; restaurants: Restaurant[] }) {
  if (restaurants.length === 0) return null;
  return (
    <section className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
      <h2 className="text-lg font-bold text-foreground">{heading}</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </section>
  );
}

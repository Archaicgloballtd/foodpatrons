import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantProfile from "@/components/RestaurantProfile";
import SimilarRestaurants from "@/components/SimilarRestaurants";
import TrackRecentlyViewed from "@/components/TrackRecentlyViewed";
import { getRestaurantById, type Restaurant } from "@/lib/restaurants";
import { getCachedRestaurants } from "@/lib/restaurantsCache";
import { normalizeArea } from "@/lib/personalization";

function firstCuisine(cuisine: string | null): string {
  return cuisine?.split(/[,&/]/)[0]?.trim().toLowerCase() ?? "";
}

// Same neighborhood first, then same cuisine, photos breaking ties — enough
// context that someone who liked this place has an obvious next click.
function pickSimilar(current: Restaurant, all: Restaurant[]): Restaurant[] {
  const area = normalizeArea(current.area).toLowerCase();
  const cuisine = firstCuisine(current.cuisine);

  return all
    .filter((r) => r.id !== current.id)
    .map((r) => {
      const sameArea = !!area && normalizeArea(r.area).toLowerCase() === area;
      const sameCuisine = !!cuisine && firstCuisine(r.cuisine) === cuisine;
      const score = (sameArea ? 3 : 0) + (sameCuisine ? 2 : 0) + (r.cover_image_url || r.image_url ? 1 : 0);
      return { r, score, relevant: sameArea || sameCuisine };
    })
    .filter((s) => s.relevant)
    .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name))
    .slice(0, 3)
    .map((s) => s.r);
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { restaurant, error } = await getRestaurantById(id);

  if (!restaurant && !error) notFound();

  const similar = restaurant ? pickSimilar(restaurant, (await getCachedRestaurants()).restaurants) : [];
  const area = restaurant ? normalizeArea(restaurant.area) : "";

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        {error && !restaurant ? (
          <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-destructive">
            Couldn&apos;t load this restaurant: {error}
          </p>
        ) : restaurant ? (
          <>
            <TrackRecentlyViewed restaurantId={restaurant.id} />
            <RestaurantProfile restaurant={restaurant} />
            <SimilarRestaurants heading={area ? `More around ${area}` : "You might also like"} restaurants={similar} />
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

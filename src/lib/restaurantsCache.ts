import "server-only";
import { unstable_cache } from "next/cache";
import { getRestaurants } from "./restaurants";

// Server-only cache layer, kept separate from restaurants.ts so client
// components (SavedRestaurants.tsx) can keep importing the plain
// uncached getRestaurants() without pulling in next/cache. Restaurant
// data doesn't change second-to-second, so a short revalidate window
// turns repeat page loads into a cache hit instead of a fresh Supabase
// round-trip every time.
export const getCachedRestaurants = unstable_cache(async () => getRestaurants(), ["restaurants-list"], {
  revalidate: 60,
});

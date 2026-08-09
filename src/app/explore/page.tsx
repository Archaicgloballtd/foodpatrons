import Navbar from "@/components/Navbar";
import ExploreExperience from "@/components/ExploreExperience";
import Footer from "@/components/Footer";
import AdSlotList from "@/components/AdSlotList";
import { getCachedRestaurants } from "@/lib/restaurantsCache";

export const metadata = {
  title: "Explore — foodpatrons",
  description: "Browse restaurants near you.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { restaurants, error } = await getCachedRestaurants();
  const { category, q } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <ExploreExperience
          restaurants={restaurants}
          error={error}
          initialCategory={category ?? "All"}
          initialQuery={q ?? ""}
          topAd={<AdSlotList slot="explore_top" />}
          sidebarAd={<AdSlotList slot="sidebar" />}
          cardAd={<AdSlotList slot="restaurant_card" />}
        />
      </main>
      <Footer />
    </div>
  );
}

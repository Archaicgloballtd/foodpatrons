import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OffersExperience from "@/components/OffersExperience";
import { getCachedRestaurants } from "@/lib/restaurantsCache";

export const metadata = {
  title: "Offers — foodpatrons",
  description: "Live deals and discounts from restaurants across Bangladesh.",
};

export default async function OffersPage() {
  const { restaurants, error } = await getCachedRestaurants();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <OffersExperience restaurants={restaurants} error={error} />
      </main>
      <Footer />
    </div>
  );
}

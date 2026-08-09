import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReserveExperience from "@/components/ReserveExperience";
import { getCachedRestaurants } from "@/lib/restaurantsCache";

export const metadata = {
  title: "Reserve a table — foodpatrons",
  description: "Book a table at a restaurant anywhere in Bangladesh in a couple of taps.",
};

export default async function ReservePage() {
  const { restaurants, error } = await getCachedRestaurants();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <ReserveExperience restaurants={restaurants} error={error} />
      </main>
      <Footer />
    </div>
  );
}

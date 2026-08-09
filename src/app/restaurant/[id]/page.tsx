import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantProfile from "@/components/RestaurantProfile";
import { getRestaurantById } from "@/lib/restaurants";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { restaurant, error } = await getRestaurantById(id);

  if (!restaurant && !error) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        {error && !restaurant ? (
          <p className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-destructive">
            Couldn&apos;t load this restaurant: {error}
          </p>
        ) : restaurant ? (
          <RestaurantProfile restaurant={restaurant} />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

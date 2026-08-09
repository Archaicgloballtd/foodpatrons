import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SavedRestaurants from "@/components/SavedRestaurants";

export const metadata = {
  title: "Saved — foodpatrons",
};

export default function SavedPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Saved restaurants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Places you&apos;ve saved on this device.
        </p>
        <div className="mt-6">
          <SavedRestaurants />
        </div>
      </main>
      <Footer />
    </div>
  );
}

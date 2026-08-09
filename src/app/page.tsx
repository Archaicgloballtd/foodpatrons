import Navbar from "@/components/Navbar";
import HomeExperience from "@/components/HomeExperience";
import Footer from "@/components/Footer";
import AdSlotList from "@/components/AdSlotList";
import { getCachedRestaurants } from "@/lib/restaurantsCache";

export default async function Home() {
  const { restaurants } = await getCachedRestaurants();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <HomeExperience restaurants={restaurants} bannerAd={<AdSlotList slot="home_banner" className="w-full" />} />
      </main>
      <Footer adSlot={<AdSlotList slot="footer" />} />
    </div>
  );
}

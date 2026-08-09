import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommunityFeed from "@/components/CommunityFeed";
import { getTopics } from "@/lib/community";

export const metadata = {
  title: "Community — foodpatrons",
  description: "Live food talk from Dhaka, by topic.",
};

export default async function CommunityPage() {
  const topics = await getTopics();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <CommunityFeed topics={topics} />
      </main>
      <Footer />
    </div>
  );
}

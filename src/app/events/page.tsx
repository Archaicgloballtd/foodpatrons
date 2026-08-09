import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventsExperience from "@/components/EventsExperience";
import { getUpcomingEvents } from "@/lib/events";

export const metadata = {
  title: "Events — foodpatrons",
  description: "Food festivals, pop-ups, and dining events around Dhaka.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ near?: string }>;
}) {
  const { events, error } = await getUpcomingEvents();
  const { near } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <EventsExperience events={events} error={error} autoLocate={near === "1"} />
      </main>
      <Footer />
    </div>
  );
}

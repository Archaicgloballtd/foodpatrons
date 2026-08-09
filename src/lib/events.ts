import { supabase } from "@/lib/supabase";

export type DhakaEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  area: string | null;
  venue_name: string | null;
  restaurant_id: string | null;
  image_url: string | null;
  source_url: string | null;
  source_label: string | null;
  restaurants: { name: string } | null;
};

const EVENT_SELECT =
  "id, title, description, event_date, event_time, area, venue_name, restaurant_id, image_url, source_url, source_label, restaurants(name)";

export async function getUpcomingEvents(): Promise<{ events: DhakaEvent[]; error: string | null }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .returns<DhakaEvent[]>();

  return { events: data ?? [], error: error?.message ?? null };
}

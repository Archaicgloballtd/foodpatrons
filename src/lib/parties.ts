import { supabase } from "@/lib/supabase";

export type PartyMember = {
  user_id: string;
  joined_at: string;
  profiles: { full_name: string | null } | null;
};

export type Party = {
  id: string;
  restaurant_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  scheduled_for: string;
  max_members: number | null;
  status: "open" | "closed" | "cancelled";
  created_at: string;
  party_members: PartyMember[];
};

export type PartyMessage = {
  id: string;
  party_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

export const PARTY_SELECT =
  "id, restaurant_id, creator_id, title, description, scheduled_for, max_members, status, created_at, party_members(user_id, joined_at, profiles(full_name))";

export async function getOpenPartiesForRestaurant(restaurantId: string): Promise<Party[]> {
  const { data } = await supabase
    .from("parties")
    .select(PARTY_SELECT)
    .eq("restaurant_id", restaurantId)
    .eq("status", "open")
    .order("scheduled_for", { ascending: true })
    .returns<Party[]>();
  return data ?? [];
}

export async function getUpcomingParties(limit = 12): Promise<Party[]> {
  const { data } = await supabase
    .from("parties")
    .select(`${PARTY_SELECT}, restaurants(id, name, area, cover_image_url, image_url)`)
    .eq("status", "open")
    .gte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit)
    .returns<(Party & { restaurants: { id: string; name: string; area: string | null; cover_image_url: string | null; image_url: string | null } | null })[]>();
  return data ?? [];
}

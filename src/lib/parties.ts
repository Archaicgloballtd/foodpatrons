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

export type PartyRestaurant = {
  id: string;
  name: string;
  area: string | null;
  cover_image_url: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PartyWithRestaurant = Party & { restaurants: PartyRestaurant | null };

export const PARTY_SELECT =
  "id, restaurant_id, creator_id, title, description, scheduled_for, max_members, status, created_at, party_members(user_id, joined_at, profiles(full_name))";

const PARTY_SELECT_WITH_RESTAURANT = `${PARTY_SELECT}, restaurants(id, name, area, cover_image_url, image_url, latitude, longitude)`;

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

export async function getUpcomingParties(limit = 12): Promise<PartyWithRestaurant[]> {
  const { data } = await supabase
    .from("parties")
    .select(PARTY_SELECT_WITH_RESTAURANT)
    .eq("status", "open")
    .gte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit)
    .returns<PartyWithRestaurant[]>();
  return data ?? [];
}

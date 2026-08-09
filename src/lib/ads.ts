import { supabase } from "@/lib/supabase";
import type { Ad, AdSlotKey } from "@/lib/adSlots";

export async function getAdsForSlot(slot: AdSlotKey): Promise<Ad[]> {
  const { data, error } = await supabase
    .from("ads")
    .select("id, title, description, image_url, link_url, slot")
    .eq("slot", slot)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

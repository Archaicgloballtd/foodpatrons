import { supabase } from "@/lib/supabase";

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_label: string | null;
  ends_at: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  rating: number | null;
  address: string | null;
  area: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  opening_hours: string | null;
  price_range: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  cover_image_url: string | null;
  is_open: boolean;
  is_featured: boolean;
  tags: string[];
  offer: Offer | null;
};

const BASE_FIELDS =
  "id, name, cuisine, rating, address, area, description, phone, whatsapp, opening_hours, price_range, latitude, longitude, image_url, cover_image_url, is_open, is_featured";
const OFFERS_FIELD = "offers(id, title, description, discount_percent, discount_label, ends_at)";

// `tags` was added after the rest of this table (see supabase/restaurant_tags.sql)
// and may not exist yet on a database that hasn't had the migration run. Try
// the full select first; if that specific column is missing, fall back to a
// select without it rather than breaking every page that lists restaurants.
const RESTAURANT_SELECT = `${BASE_FIELDS}, tags, ${OFFERS_FIELD}`;
const RESTAURANT_SELECT_NO_TAGS = `${BASE_FIELDS}, ${OFFERS_FIELD}`;

type RestaurantRow = Omit<Restaurant, "offer" | "tags"> & { offers: Offer[] | null; tags?: string[] | null };

function mapRow(row: RestaurantRow): Restaurant {
  const { offers, tags, ...rest } = row;
  return { ...rest, tags: tags ?? [], offer: offers && offers.length > 0 ? offers[0] : null };
}

function isMissingTagsColumn(message: string | undefined): boolean {
  return !!message && message.includes("tags") && message.includes("does not exist");
}

export async function getRestaurants(): Promise<{
  restaurants: Restaurant[];
  error: string | null;
}> {
  const first = await supabase
    .from("restaurants")
    .select(RESTAURANT_SELECT)
    .order("rating", { ascending: false, nullsFirst: false });
  let data: RestaurantRow[] | null = first.data as RestaurantRow[] | null;
  let error = first.error;

  if (error && isMissingTagsColumn(error.message)) {
    const retry = await supabase
      .from("restaurants")
      .select(RESTAURANT_SELECT_NO_TAGS)
      .order("rating", { ascending: false, nullsFirst: false });
    data = retry.data as RestaurantRow[] | null;
    error = retry.error;
  }

  return {
    restaurants: data?.map(mapRow) ?? [],
    error: error?.message ?? null,
  };
}

export async function getRestaurantById(id: string): Promise<{
  restaurant: Restaurant | null;
  error: string | null;
}> {
  const first = await supabase.from("restaurants").select(RESTAURANT_SELECT).eq("id", id).maybeSingle();
  let data: RestaurantRow | null = first.data as RestaurantRow | null;
  let error = first.error;

  if (error && isMissingTagsColumn(error.message)) {
    const retry = await supabase.from("restaurants").select(RESTAURANT_SELECT_NO_TAGS).eq("id", id).maybeSingle();
    data = retry.data as RestaurantRow | null;
    error = retry.error;
  }

  return {
    restaurant: data ? mapRow(data) : null,
    error: error?.message ?? null,
  };
}

export async function getRestaurantsByIds(ids: string[]): Promise<{
  restaurants: Restaurant[];
  error: string | null;
}> {
  if (ids.length === 0) return { restaurants: [], error: null };

  const first = await supabase.from("restaurants").select(RESTAURANT_SELECT).in("id", ids);
  let data: RestaurantRow[] | null = first.data as RestaurantRow[] | null;
  let error = first.error;

  if (error && isMissingTagsColumn(error.message)) {
    const retry = await supabase.from("restaurants").select(RESTAURANT_SELECT_NO_TAGS).in("id", ids);
    data = retry.data as RestaurantRow[] | null;
    error = retry.error;
  }

  return {
    restaurants: data?.map(mapRow) ?? [],
    error: error?.message ?? null,
  };
}

/** Great-circle distance between two points, in kilometers. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

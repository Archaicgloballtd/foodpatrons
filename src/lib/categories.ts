import { Clock, CalendarCheck, Coffee, Building2, UtensilsCrossed, type LucideIcon } from "lucide-react";

export type Category = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export const categories: Category[] = [
  { key: "open-now", label: "Open Now", icon: Clock },
  { key: "book-tonight", label: "Book Tonight", icon: CalendarCheck },
  { key: "cafe", label: "Cafe", icon: Coffee },
  { key: "rooftop", label: "Rooftop", icon: Building2 },
  { key: "buffet", label: "Buffet", icon: UtensilsCrossed },
];

type CategorySubject = {
  name?: string;
  cuisine: string | null;
  address: string | null;
  offer: unknown;
  is_open: boolean;
  tags?: string[] | null;
};

export function restaurantMatchesCategory(restaurant: CategorySubject, key: string): boolean {
  if (key === "offers") return !!restaurant.offer;
  // "Book Tonight" means bookable right now — same restaurants as Open Now,
  // each already has a working Reserve button/form on its card.
  if (key === "open-now" || key === "book-tonight") return restaurant.is_open;

  const tags = restaurant.tags ?? [];
  if (key === "rooftop" || key === "buffet") {
    if (tags.includes(key)) return true;
  }

  const needle = key.replace(/-/g, " ");
  const haystack = `${restaurant.name ?? ""} ${restaurant.cuisine ?? ""} ${restaurant.address ?? ""}`.toLowerCase();
  return haystack.includes(needle);
}

import {
  Clock,
  CalendarCheck,
  Coffee,
  Building2,
  UtensilsCrossed,
  Pizza,
  Sandwich,
  Beef,
  Wheat,
  Soup,
  Fish,
  Cake,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Words that count as a match in a restaurant's name, cuisine, address or
   * description. Falls back to the key itself. Lets "Rice" find biryani and
   * polao spots, not just places with the literal word "rice" in the name. */
  keywords?: string[];
};

export const categories: Category[] = [
  { key: "open-now", label: "Open Now", icon: Clock },
  { key: "book-tonight", label: "Book Tonight", icon: CalendarCheck },
  { key: "cafe", label: "Cafe", icon: Coffee },
  { key: "rooftop", label: "Rooftop", icon: Building2 },
  { key: "buffet", label: "Buffet", icon: UtensilsCrossed },
  { key: "pizza", label: "Pizza", icon: Pizza, keywords: ["pizza", "pizzeria", "italian"] },
  { key: "burger", label: "Burgers", icon: Sandwich, keywords: ["burger", "fast food", "sandwich"] },
  { key: "steak", label: "Steak & Grill", icon: Beef, keywords: ["steak", "grill", "bbq", "barbecue", "barbeque"] },
  {
    key: "rice",
    label: "Rice & Biryani",
    icon: Wheat,
    keywords: ["rice", "biryani", "biriyani", "polao", "pulao", "tehari", "khichuri", "kacchi"],
  },
  {
    key: "noodles",
    label: "Noodles",
    icon: Soup,
    keywords: ["noodle", "ramen", "chinese", "thai", "hakka", "dim sum", "pho"],
  },
  { key: "seafood", label: "Seafood", icon: Fish, keywords: ["seafood", "sea food", "fish", "sushi"] },
  {
    key: "dessert",
    label: "Desserts",
    icon: Cake,
    keywords: ["dessert", "cake", "bakery", "chocolate", "ice cream", "pastry", "patisserie"],
  },
];

type CategorySubject = {
  name?: string;
  cuisine: string | null;
  address: string | null;
  description?: string | null;
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

  const keywords = categories.find((c) => c.key === key)?.keywords ?? [key.replace(/-/g, " ")];
  const haystack =
    `${restaurant.name ?? ""} ${restaurant.cuisine ?? ""} ${restaurant.address ?? ""} ${restaurant.description ?? ""}`.toLowerCase();
  return keywords.some((word) => haystack.includes(word));
}

// Prices are a starting rate card (BDT/month) — edit freely once you have a
// sense of real demand. Nothing charges automatically yet: a request just
// records the price the restaurant agreed to at request time.
export const AD_SLOTS = [
  { key: "home_popup", label: "Homepage popup", description: "Seen by every visitor on their first homepage load.", price: 8000 },
  { key: "home_banner", label: "Homepage banner", description: "Prime placement in the homepage feed.", price: 6000 },
  { key: "explore_top", label: "Explore page top", description: "Top of the page most people use to browse restaurants.", price: 5000 },
  { key: "sidebar", label: "Sidebar", description: "Persistent placement alongside content.", price: 3000 },
  { key: "restaurant_card", label: "Restaurant card", description: "Sponsored card mixed into restaurant listings.", price: 2500 },
  { key: "footer", label: "Footer", description: "Lightweight, lowest-cost visibility on every page.", price: 1500 },
] as const;

export type AdSlotKey = (typeof AD_SLOTS)[number]["key"];

export type Ad = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  slot: string;
};

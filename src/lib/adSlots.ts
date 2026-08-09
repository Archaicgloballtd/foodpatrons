export const AD_SLOTS = [
  { key: "home_popup", label: "Homepage popup" },
  { key: "home_banner", label: "Homepage banner" },
  { key: "sidebar", label: "Sidebar" },
  { key: "explore_top", label: "Explore page top" },
  { key: "restaurant_card", label: "Restaurant card" },
  { key: "footer", label: "Footer" },
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

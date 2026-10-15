// Lightweight, account-free personalization: what time of day it is, and
// what this browser has saved or looked at recently. All of it lives in
// localStorage — nothing is sent anywhere, and it works signed out.

export const SAVED_KEY = "fp_saved_restaurant_ids";
export const RECENT_KEY = "fp_recent_restaurant_ids";
const RECENT_MAX = 8;

function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function readSavedIds(): string[] {
  return readIds(SAVED_KEY);
}

export function readRecentIds(): string[] {
  return readIds(RECENT_KEY);
}

export function pushRecentId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [id, ...readIds(RECENT_KEY).filter((existing) => existing !== id)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private window, quota) — personalization is a nicety, never a blocker
  }
}

export type DayPart = "morning" | "lunch" | "afternoon" | "dinner" | "late";

export function getDayPart(now: Date = new Date()): DayPart {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "dinner";
  return "late";
}

export type DayPartCopy = {
  greeting: string;
  prompt: string;
  chips: { label: string; href: string }[];
};

export const DAYPART_COPY: Record<DayPart, DayPartCopy> = {
  morning: {
    greeting: "Good morning",
    prompt: "Coffee, breakfast, or something slow to start the day?",
    chips: [
      { label: "Cafes", href: "/explore?category=cafe" },
      { label: "Open now", href: "/explore?category=open-now" },
    ],
  },
  lunch: {
    greeting: "Lunchtime",
    prompt: "Where's lunch today? Here's what's open.",
    chips: [
      { label: "Open now", href: "/explore?category=open-now" },
      { label: "Buffets", href: "/explore?category=buffet" },
      { label: "Cafes", href: "/explore?category=cafe" },
    ],
  },
  afternoon: {
    greeting: "Good afternoon",
    prompt: "A coffee break, or lock in a table for tonight?",
    chips: [
      { label: "Cafes", href: "/explore?category=cafe" },
      { label: "Book tonight", href: "/explore?category=book-tonight" },
    ],
  },
  dinner: {
    greeting: "Good evening",
    prompt: "Planning tonight? Grab a table before the rush.",
    chips: [
      { label: "Book tonight", href: "/explore?category=book-tonight" },
      { label: "Rooftops", href: "/explore?category=rooftop" },
      { label: "Buffets", href: "/explore?category=buffet" },
    ],
  },
  late: {
    greeting: "Late night",
    prompt: "Hungry late? See what's still open.",
    chips: [{ label: "Open now", href: "/explore?category=open-now" }],
  },
};

/** "Gulshan 2" / "Gulshan 1" / "Gulshan" all read as one neighborhood to a diner. */
export function normalizeArea(area: string | null | undefined): string {
  return (area ?? "").replace(/\s+\d+$/, "").trim();
}

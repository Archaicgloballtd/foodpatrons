export type MembershipTier = "Bronze" | "Silver" | "Gold" | "Platinum";

const TIER_THRESHOLDS: { tier: MembershipTier; min: number }[] = [
  { tier: "Platinum", min: 500 },
  { tier: "Gold", min: 250 },
  { tier: "Silver", min: 100 },
  { tier: "Bronze", min: 0 },
];

export function tierForPoints(points: number): MembershipTier {
  return TIER_THRESHOLDS.find((t) => points >= t.min)?.tier ?? "Bronze";
}

// null next means already at the top tier.
export function nextTier(points: number): { tier: MembershipTier; pointsNeeded: number; progressPct: number } | null {
  const ascending = [...TIER_THRESHOLDS].reverse();
  const currentIndex = ascending.findIndex((t) => t.tier === tierForPoints(points));
  const current = ascending[currentIndex];
  const next = ascending[currentIndex + 1];
  if (!next) return null;
  const span = next.min - current.min;
  const progressPct = span > 0 ? Math.max(4, Math.min(100, ((points - current.min) / span) * 100)) : 100;
  return { tier: next.tier, pointsNeeded: next.min - points, progressPct };
}

export const POINTS_INFO = [
  { action: "Book a table", points: 10 },
  { action: "Claim an offer", points: 15 },
  { action: "Post in the community", points: 5 },
] as const;

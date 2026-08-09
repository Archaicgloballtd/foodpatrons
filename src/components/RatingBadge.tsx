import { Star } from "lucide-react";

// Tiered color-coded rating pill — the Zomato/Swiggy pattern of making a
// restaurant's quality tier readable at a glance, not just the raw number.
const TIERS = [
  { min: 4.5, bg: "bg-emerald-600", text: "text-white" },
  { min: 4.0, bg: "bg-secondary", text: "text-white" },
  { min: 3.5, bg: "bg-brand-sunny", text: "text-foreground" },
  { min: 0, bg: "bg-muted-foreground/70", text: "text-white" },
];

function tierFor(rating: number) {
  return TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1];
}

export default function RatingBadge({
  rating,
  size = "sm",
}: {
  rating: number | null;
  size?: "sm" | "md";
}) {
  if (rating === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
        New
      </span>
    );
  }

  const tier = tierFor(rating);
  const sizeClasses = size === "md" ? "gap-1 px-2 py-1 text-sm" : "gap-0.5 px-1.5 py-0.5 text-xs";
  const starSize = size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";

  return (
    <span className={`inline-flex items-center rounded-md font-bold ${tier.bg} ${tier.text} ${sizeClasses}`}>
      {rating.toFixed(1)}
      <Star className={`${starSize} fill-current`} />
    </span>
  );
}

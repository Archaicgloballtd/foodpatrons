import { Banknote } from "lucide-react";

const TIERS: Record<string, { label: string; bg: string; text: string }> = {
  "৳": { label: "Budget-friendly", bg: "bg-emerald-100", text: "text-emerald-700" },
  "৳৳": { label: "Mid-range", bg: "bg-amber-100", text: "text-amber-700" },
  "৳৳৳": { label: "Upscale", bg: "bg-violet-100", text: "text-violet-700" },
};

export default function BudgetBadge({
  priceRange,
  size = "sm",
}: {
  priceRange: string | null;
  size?: "sm" | "md";
}) {
  if (!priceRange) return null;
  const tier = TIERS[priceRange];
  const sizeClasses = size === "md" ? "gap-1.5 px-3 py-1.5 text-sm" : "gap-1 px-2 py-1 text-xs";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses} ${tier?.bg ?? "bg-muted"} ${tier?.text ?? "text-muted-foreground"}`}
    >
      <Banknote className={iconSize} />
      {priceRange}
      {tier && <span className="opacity-80">· {tier.label}</span>}
    </span>
  );
}

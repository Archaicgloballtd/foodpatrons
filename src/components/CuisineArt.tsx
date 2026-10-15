import { Coffee, Pizza, Soup, Fish, Beef, Cake, Sandwich, Utensils, type LucideProps } from "lucide-react";

// Honest placeholder for restaurants we don't have a real photo of yet: an
// illustrated tile themed to the cuisine, instead of a blank grey box. It's
// deliberately an illustration, never a stock photo passed off as the place.

const PALETTE = ["#F97316", "#8B5CF6", "#14B8A6", "#FF6B6B", "#EAB308", "#1B2560"];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function CuisineIcon({ cuisine, name, ...props }: { cuisine: string | null; name: string } & LucideProps) {
  const t = `${cuisine ?? ""} ${name}`.toLowerCase();
  if (/cafe|café|coffee|espresso|roaster|\btea\b/.test(t)) return <Coffee {...props} />;
  if (/cake|dessert|chocolate|bakery|pastry|patisserie|ice cream/.test(t)) return <Cake {...props} />;
  if (/pizza|italian|pasta/.test(t)) return <Pizza {...props} />;
  if (/burger|fast food|sandwich/.test(t)) return <Sandwich {...props} />;
  if (/seafood|sea food|fish|sushi/.test(t)) return <Fish {...props} />;
  if (/bbq|barbec|grill|steak|kabab|kebab|tandoor/.test(t)) return <Beef {...props} />;
  if (/chinese|thai|japanese|korean|asian|ramen|noodle|tibetan|dim sum|hakka|vietnam/.test(t)) return <Soup {...props} />;
  return <Utensils {...props} />;
}

export default function CuisineArt({
  cuisine,
  name,
  area,
  compact = false,
}: {
  cuisine: string | null;
  name: string;
  area?: string | null;
  compact?: boolean;
}) {
  const color = PALETTE[hash(cuisine ?? name) % PALETTE.length];

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color}2b, ${color}0d)` }}
      aria-hidden="true"
    >
      <CuisineIcon
        cuisine={cuisine}
        name={name}
        className={compact ? "h-6 w-6" : "h-14 w-14"}
        style={{ color }}
        strokeWidth={1.6}
      />
      {!compact && area && (
        <span
          className="absolute bottom-2 left-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: `${color}cc` }}
        >
          {area}
        </span>
      )}
    </div>
  );
}

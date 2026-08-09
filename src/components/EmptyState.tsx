import type { LucideIcon } from "lucide-react";
import { UtensilsCrossed } from "lucide-react";
import Mascot from "./Mascot";

export default function EmptyState({
  icon: Icon = UtensilsCrossed,
  title,
  description,
  mascot,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  mascot?: "search" | "sad";
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-muted/60 px-6 py-12 text-center">
      {mascot ? (
        <Mascot pose={mascot} size={96} />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

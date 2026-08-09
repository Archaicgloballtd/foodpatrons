"use client";

import { useId } from "react";

// A single silhouette: a location pin with a bite taken out of it — food +
// place in one shape, one color, no fine detail to lose at 16px. Deliberately
// plain the way a real brand mark is plain (no badge, no face, no gimmick).
export function LogoMark({ size = 36, color = "#F97316" }: { size?: number; color?: string }) {
  const maskId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <mask id={maskId}>
        <rect width="40" height="40" fill="black" />
        <path
          d="M20 3C12.268 3 6 9.268 6 17c0 10.5 14 19 14 19s14-8.5 14-19C34 9.268 27.732 3 20 3z"
          fill="white"
        />
        <circle cx="27" cy="10" r="6.5" fill="black" />
      </mask>
      <rect width="40" height="40" fill={color} mask={`url(#${maskId})`} />
    </svg>
  );
}

export default function Logo({
  size = 36,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      {showWordmark && (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            foodpatrons
          </span>
          <span className="text-[11px] font-medium text-primary">make food friends</span>
        </span>
      )}
    </span>
  );
}

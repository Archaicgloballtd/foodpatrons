import type { Ad } from "@/lib/adSlots";

export default function AdSlot({ ad, className }: { ad: Ad; className?: string }) {
  const card = (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card ${className ?? ""}`}
    >
      {ad.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
        <img src={ad.image_url} alt={ad.title} className="h-32 w-full object-cover" />
      )}
      <div className="p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sponsored
        </span>
        <p className="mt-0.5 text-sm font-bold text-foreground">{ad.title}</p>
        {ad.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ad.description}</p>
        )}
      </div>
    </div>
  );

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
        {card}
      </a>
    );
  }

  return card;
}

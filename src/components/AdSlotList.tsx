import { getAdsForSlot } from "@/lib/ads";
import type { AdSlotKey } from "@/lib/adSlots";
import AdSlot from "./AdSlot";

export default async function AdSlotList({
  slot,
  limit = 1,
  className,
}: {
  slot: AdSlotKey;
  limit?: number;
  className?: string;
}) {
  const ads = await getAdsForSlot(slot);
  if (ads.length === 0) return null;

  return (
    <>
      {ads.slice(0, limit).map((ad) => (
        <AdSlot key={ad.id} ad={ad} className={className} />
      ))}
    </>
  );
}

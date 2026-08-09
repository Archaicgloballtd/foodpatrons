"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Offer = {
  id: string;
  title: string;
  discount_label: string | null;
  discount_percent: number | null;
  ends_at: string | null;
  restaurants: { name: string; area: string | null } | null;
};

type NewRestaurant = {
  id: string;
  name: string;
  area: string | null;
  cuisine: string | null;
  created_at: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex shrink-0 items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AdminMarketing() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newRestaurants, setNewRestaurants] = useState<NewRestaurant[]>([]);
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [offersRes, newRes, totalRes] = await Promise.all([
        supabase
          .from("offers")
          .select("id, title, discount_label, discount_percent, ends_at, restaurants(name, area)")
          .eq("is_active", true)
          .order("ends_at", { ascending: true })
          .limit(8),
        supabase
          .from("restaurants")
          .select("id, name, area, cuisine, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("restaurants").select("*", { count: "exact", head: true }),
      ]);
      setOffers((offersRes.data as unknown as Offer[]) ?? []);
      setNewRestaurants(newRes.data ?? []);
      setTotalRestaurants(totalRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Building this week&apos;s marketing content…</p>;

  const digest = `This week on foodpatrons: ${totalRestaurants}+ restaurants and cafes across Bangladesh, ${offers.length} live offer${offers.length === 1 ? "" : "s"} to claim, and new spots added regularly. Browse, compare, and reserve free at foodpatrons.com.`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">This week&apos;s digest</h3>
        <div className="mt-2 flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <p className="flex-1 text-sm text-foreground/80">{digest}</p>
          <CopyButton text={digest} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Live offers to promote</h3>
        {offers.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No active offers right now.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {offers.map((o) => {
              const discount = o.discount_label ?? (o.discount_percent ? `${o.discount_percent}% off` : "a live offer");
              const caption = `${o.restaurants?.name ?? "A restaurant"}${
                o.restaurants?.area ? ` in ${o.restaurants.area}` : ""
              } is running ${discount} — "${o.title}". Claim it free on foodpatrons.com before it ends!`;
              return (
                <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <p className="flex-1 text-sm text-foreground/80">{caption}</p>
                  <CopyButton text={caption} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Newest listings</h3>
        <div className="mt-2 flex flex-col gap-2">
          {newRestaurants.map((r) => {
            const caption = `Just added to foodpatrons: ${r.name}${r.area ? `, ${r.area}` : ""}${
              r.cuisine ? ` — ${r.cuisine} cuisine` : ""
            }. Check it out and reserve free at foodpatrons.com.`;
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <p className="flex-1 text-sm text-foreground/80">{caption}</p>
                <CopyButton text={caption} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

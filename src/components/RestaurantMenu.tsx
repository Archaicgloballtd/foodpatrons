"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import EmptyState from "./EmptyState";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
};

export default function RestaurantMenu({ restaurantId }: { restaurantId: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        setUnavailable(true);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [restaurantId]);

  if (loading || unavailable) return null;

  const groups = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category ?? "Menu";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-foreground">Menu</h2>
      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={UtensilsCrossed}
            title="Menu coming soon"
            description="This restaurant hasn't added its menu yet — check back later or call ahead to ask what's on offer."
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-5">
          {Object.entries(groups).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{category}</h3>
              <ul className="mt-2 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    {item.price !== null && (
                      <span className="shrink-0 text-sm font-bold text-foreground">৳{item.price}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

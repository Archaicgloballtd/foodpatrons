"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  name: string;
  area: string | null;
  phone: string | null;
  opening_hours: string | null;
  price_range: string | null;
  cover_image_url: string | null;
  image_url: string | null;
  description: string | null;
};

const FIELDS: { key: keyof Row; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "opening_hours", label: "Hours" },
  { key: "phone", label: "Phone" },
  { key: "price_range", label: "Price range" },
];

function missingFields(r: Row): string[] {
  const missing = FIELDS.filter((f) => !r[f.key]).map((f) => f.label);
  if (!r.cover_image_url && !r.image_url) missing.push("Photo");
  return missing;
}

export default function AdminDataGaps() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, area, phone, opening_hours, price_range, cover_image_url, image_url, description");
      if (error) {
        setError(error.message);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Scanning restaurant data…</p>;
  if (error) return <p className="text-sm text-destructive">Couldn&apos;t load restaurants: {error}</p>;

  const totalFields = FIELDS.length + 1; // + photo
  const withGaps = rows
    .map((r) => ({ row: r, missing: missingFields(r) }))
    .filter((r) => r.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length);

  const complete = rows.length - withGaps.length;
  const avgCompleteness =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, r) => sum + (totalFields - missingFields(r).length), 0) / (rows.length * totalFields)) *
            100,
        );

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          <p className="text-xs text-muted-foreground">Total restaurants</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{complete}</p>
          <p className="text-xs text-muted-foreground">Fully complete</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgCompleteness}%</p>
          <p className="text-xs text-muted-foreground">Avg. data completeness</p>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Worst-first — the listings most in need of a phone number, hours, price range, description, or photo. Edit
        any of these from the Restaurants tab.
      </p>

      <div className="flex flex-col gap-2">
        {withGaps.slice(0, visibleCount).map(({ row, missing }) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{row.name}</p>
              {row.area && <p className="text-xs text-muted-foreground">{row.area}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {missing.map((m) => (
                <span key={m} className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {visibleCount < withGaps.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + 30)}
            className="rounded-full border border-border bg-white px-6 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Show more ({withGaps.length - visibleCount} left)
          </button>
        </div>
      )}
    </div>
  );
}

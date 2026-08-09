"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurants: { name: string } | null;
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at, restaurants(name)")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setReviews((data as unknown as Review[]) ?? []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function remove(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  if (error && reviews.length === 0) return <p className="text-sm text-destructive">Couldn&apos;t load reviews: {error}</p>;
  if (reviews.length === 0) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;

  return (
    <div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  {r.restaurants?.name ?? "Unknown restaurant"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.customer_name} · {new Date(r.created_at).toLocaleDateString()}
                </p>
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={deletingId === r.id}
                className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingId === r.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import EmptyState from "./EmptyState";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
};

function StarRow({
  value,
  size = "h-4 w-4",
  onPick,
}: {
  value: number;
  size?: string;
  onPick?: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          aria-label={onPick ? `Rate ${n} star${n === 1 ? "" : "s"}` : undefined}
          className={onPick ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`${size} ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

export default function RestaurantReviews({ restaurantId }: { restaurantId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at, owner_reply, owner_reply_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: restaurantId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setRating(0);
    setComment("");
    setShowForm(false);
    load();
  }

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Reviews</h2>
          {average !== null && (
            <div className="mt-1 flex items-center gap-2">
              <StarRow value={Math.round(average)} />
              <span className="text-sm font-semibold text-foreground">{average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          {showForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div>
            <p className="mb-1 text-sm font-semibold text-foreground">Your rating</p>
            <StarRow value={rating} size="h-6 w-6" onPick={setRating} />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Your name
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Comment (optional)
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post review"}
          </button>
        </form>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="Be the first to share how it went."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{r.customer_name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <StarRow value={r.rating} />
                {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
                {r.owner_reply && (
                  <div className="mt-3 rounded-xl bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary">Response from the owner</p>
                    <p className="mt-1 text-sm text-foreground/80">{r.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

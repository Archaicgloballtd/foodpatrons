"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
};

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-orange-500 text-orange-500" : "text-zinc-300 dark:text-zinc-700"}`}
        />
      ))}
    </div>
  );
}

export default function DashboardReviews({ restaurantId }: { restaurantId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

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

  function startReply(review: Review) {
    setEditingId(review.id);
    setDraft(review.owner_reply ?? "");
  }

  async function saveReply(reviewId: string) {
    setSaving(true);
    await supabase
      .from("reviews")
      .update({ owner_reply: draft.trim() || null, owner_reply_at: new Date().toISOString() })
      .eq("id", reviewId);
    setSaving(false);
    setEditingId(null);
    setDraft("");
    load();
  }

  async function removeReply(reviewId: string) {
    await supabase.from("reviews").update({ owner_reply: null, owner_reply_at: null }).eq("id", reviewId);
    load();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-zinc-500">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-black/10 p-4 text-sm dark:border-white/10">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{r.customer_name}</p>
            <span className="shrink-0 text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <StarRow value={r.rating} />
          {r.comment && <p className="mt-2 text-foreground/80">{r.comment}</p>}

          {r.owner_reply && editingId !== r.id && (
            <div className="mt-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-500/10">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Your reply</p>
              <p className="mt-1 text-foreground/80">{r.owner_reply}</p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => startReply(r)}
                  className="text-xs font-semibold text-orange-700 hover:underline dark:text-orange-400"
                >
                  Edit reply
                </button>
                <button
                  type="button"
                  onClick={() => removeReply(r.id)}
                  className="text-xs font-semibold text-zinc-500 hover:underline"
                >
                  Remove reply
                </button>
              </div>
            </div>
          )}

          {editingId === r.id ? (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Thank the customer or address their feedback…"
                className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveReply(r.id)}
                  className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Post reply"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft("");
                  }}
                  className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            !r.owner_reply && (
              <button
                type="button"
                onClick={() => startReply(r)}
                className="mt-3 rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
              >
                Reply as restaurant
              </button>
            )
          )}
        </li>
      ))}
    </ul>
  );
}

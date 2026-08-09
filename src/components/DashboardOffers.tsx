"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  is_active: boolean;
  ends_at: string | null;
};

const emptyForm = { title: "", description: "", discount_percent: "", ends_at: "" };

export default function DashboardOffers({ restaurantId }: { restaurantId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("offers")
      .select("id, title, description, discount_percent, is_active, ends_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    setOffers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  function startEdit(offer: Offer) {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description ?? "",
      discount_percent: offer.discount_percent?.toString() ?? "",
      ends_at: offer.ends_at ? offer.ends_at.slice(0, 16) : "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      restaurant_id: restaurantId,
      title: form.title,
      description: form.description || null,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    if (editingId) {
      await supabase.from("offers").update(payload).eq("id", editingId);
    } else {
      await supabase.from("offers").insert(payload);
    }
    setSaving(false);
    resetForm();
    load();
  }

  async function toggleActive(offer: Offer) {
    await supabase.from("offers").update({ is_active: !offer.is_active }).eq("id", offer.id);
    load();
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-2 dark:border-white/10"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Title
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Description
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Discount %
          <input
            type="number"
            min={1}
            max={100}
            value={form.discount_percent}
            onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ends at
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update offer" : "Add offer"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading offers…</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-zinc-500">No offers yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10"
            >
              <div>
                <p className="font-semibold">
                  {offer.title} {offer.discount_percent && `(${offer.discount_percent}% off)`}
                </p>
                <p className="text-xs text-zinc-500">
                  {offer.is_active ? "Active" : "Inactive"}
                  {offer.ends_at && ` · ends ${new Date(offer.ends_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(offer)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(offer)}
                  className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
                >
                  {offer.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

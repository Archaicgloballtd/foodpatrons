"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_available: boolean;
};

const emptyForm = { name: "", description: "", price: "", category: "" };

export default function DashboardMenu({ restaurantId }: { restaurantId: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, description, price, category, is_available")
      .eq("restaurant_id", restaurantId)
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      // Table not migrated yet on this environment — fail soft.
      setUnavailable(true);
      setItems([]);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price?.toString() ?? "",
      category: item.category ?? "",
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
      name: form.name,
      description: form.description || null,
      price: form.price ? Number(form.price) : null,
      category: form.category || null,
    };

    if (editingId) {
      await supabase.from("menu_items").update(payload).eq("id", editingId);
    } else {
      await supabase.from("menu_items").insert(payload);
    }
    setSaving(false);
    resetForm();
    load();
  }

  async function toggleAvailable(item: MenuItem) {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    load();
  }

  async function removeItem(id: string) {
    await supabase.from("menu_items").delete().eq("id", id);
    load();
  }

  if (unavailable) {
    return (
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Menu items aren&apos;t set up on this environment yet.
      </p>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-2 dark:border-white/10"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Dish name
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          Price (৳)
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Category
          <input
            type="text"
            placeholder="e.g. Starters, Mains, Drinks"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update item" : "Add item"}
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
        <p className="text-sm text-zinc-500">Loading menu…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No menu items yet. Add a few dishes above so customers can see what you serve.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10"
            >
              <div>
                <p className="font-semibold">
                  {item.name} {item.price !== null && `— ৳${item.price}`}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.category ?? "Uncategorized"}
                  {!item.is_available && " · Unavailable"}
                  {item.description && ` · ${item.description}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleAvailable(item)}
                  className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
                >
                  {item.is_available ? "Mark 86'd" : "Mark available"}
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

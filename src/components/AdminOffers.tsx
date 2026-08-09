"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminOffer = {
  id: string;
  restaurant_id: string;
  title: string;
  discount_label: string | null;
  discount_percent: number | null;
  is_active: boolean;
  ends_at: string | null;
  restaurants: { name: string } | null;
};

type RestaurantOption = { id: string; name: string };

type OfferInput = {
  restaurant_id: string;
  title: string;
  discount_label: string;
  discount_percent: string;
  description: string;
  terms: string;
  start_date: string;
  end_date: string;
  active: boolean;
};

const emptyForm: OfferInput = {
  restaurant_id: "",
  title: "",
  discount_label: "",
  discount_percent: "",
  description: "",
  terms: "",
  start_date: "",
  end_date: "",
  active: true,
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<OfferInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [offersResult, restaurantsResult] = await Promise.all([
        supabase
          .from("offers")
          .select(
            "id, restaurant_id, title, discount_label, discount_percent, is_active, ends_at, restaurants(name)",
          )
          .order("created_at", { ascending: false }),
        supabase.from("restaurants").select("id, name").order("name"),
      ]);
      if (offersResult.error) throw offersResult.error;
      setOffers(offersResult.data as unknown as AdminOffer[]);
      setRestaurants(restaurantsResult.data ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load offers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error } = await supabase.from("offers").insert({
      restaurant_id: form.restaurant_id,
      title: form.title,
      discount_label: form.discount_label || null,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      description: form.description || null,
      terms: form.terms || null,
      starts_at: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      ends_at: form.end_date ? new Date(form.end_date).toISOString() : null,
      is_active: form.active,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function toggle(id: string, current: boolean) {
    await supabase.from("offers").update({ is_active: !current }).eq("id", id);
    load();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="mb-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {showForm ? "Close form" : "+ Add offer"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Restaurant
            <select
              required
              value={form.restaurant_id}
              onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select a restaurant</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field
            label="Discount label (e.g. Buy 1 Get 1)"
            value={form.discount_label}
            onChange={(v) => setForm({ ...form, discount_label: v })}
          />
          <Field
            label="Discount %"
            type="number"
            value={form.discount_percent}
            onChange={(v) => setForm({ ...form, discount_percent: v })}
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            span2
          />
          <Field label="Terms" value={form.terms} onChange={(v) => setForm({ ...form, terms: v })} span2 />
          <Field
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(v) => setForm({ ...form, start_date: v })}
          />
          <Field
            label="End date"
            type="date"
            value={form.end_date}
            onChange={(v) => setForm({ ...form, end_date: v })}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add offer"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading offers…</p>
      ) : error && offers.length === 0 ? (
        <p className="text-sm text-destructive">Couldn&apos;t load offers: {error}</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-semibold">
                  {offer.title}{" "}
                  {offer.discount_label ? `(${offer.discount_label})` : offer.discount_percent ? `(${offer.discount_percent}% off)` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {offer.restaurants?.name ?? "—"} · {offer.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(offer.id, offer.is_active)}
                className="shrink-0 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-white hover:bg-foreground/80"
              >
                {offer.is_active ? "Deactivate" : "Activate"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  span2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  span2?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${span2 ? "sm:col-span-2" : ""}`}>
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

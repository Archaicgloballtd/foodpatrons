"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RestaurantProfile = {
  name: string;
  cuisine: string | null;
  area: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  opening_hours: string | null;
  price_range: string | null;
  cover_image_url: string | null;
  is_open: boolean;
};

const emptyForm = {
  cuisine: "",
  area: "",
  address: "",
  description: "",
  phone: "",
  whatsapp: "",
  opening_hours: "",
  price_range: "",
  cover_image_url: "",
  is_open: true,
};

export default function DashboardRestaurantProfile({ restaurantId }: { restaurantId: string }) {
  const [name, setName] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setSaved(false);
    const { data, error } = await supabase
      .from("restaurants")
      .select("name, cuisine, area, address, description, phone, whatsapp, opening_hours, price_range, cover_image_url, is_open")
      .eq("id", restaurantId)
      .single();
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const r = data as RestaurantProfile;
    setName(r.name);
    setForm({
      cuisine: r.cuisine ?? "",
      area: r.area ?? "",
      address: r.address ?? "",
      description: r.description ?? "",
      phone: r.phone ?? "",
      whatsapp: r.whatsapp ?? "",
      opening_hours: r.opening_hours ?? "",
      price_range: r.price_range ?? "",
      cover_image_url: r.cover_image_url ?? "",
      is_open: r.is_open,
    });
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const { error } = await supabase
      .from("restaurants")
      .update({
        cuisine: form.cuisine || null,
        area: form.area || null,
        address: form.address || null,
        description: form.description || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        opening_hours: form.opening_hours || null,
        price_range: form.price_range || null,
        cover_image_url: form.cover_image_url || null,
        image_url: form.cover_image_url || null,
        is_open: form.is_open,
      })
      .eq("id", restaurantId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading restaurant profile…</p>;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Restaurant name</p>
        <p className="text-base font-bold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          Ask an admin if this needs to change — everything else below is yours to edit.
        </p>
      </div>

      <Field label="Cuisine" value={form.cuisine} onChange={(v) => setForm({ ...form, cuisine: v })} />
      <Field label="Area" value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
      <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} span2 />
      <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} span2 />
      <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
      <Field label="Opening hours" value={form.opening_hours} onChange={(v) => setForm({ ...form, opening_hours: v })} />
      <Field label="Price range (e.g. $$)" value={form.price_range} onChange={(v) => setForm({ ...form, price_range: v })} />
      <Field
        label="Cover image URL"
        value={form.cover_image_url}
        onChange={(v) => setForm({ ...form, cover_image_url: v })}
        span2
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_open}
          onChange={(e) => setForm({ ...form, is_open: e.target.checked })}
        />
        Currently open
      </label>

      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      {saved && <p className="text-sm text-secondary sm:col-span-2">Saved.</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  span2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  span2?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${span2 ? "sm:col-span-2" : ""}`}>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

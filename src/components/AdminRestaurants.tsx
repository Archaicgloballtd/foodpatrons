"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminRestaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  image_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
  is_open: boolean;
  status: "pending" | "approved" | "rejected";
  commission_per_reservation: number | null;
};

type RestaurantInput = {
  name: string;
  cuisine: string;
  area: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  phone: string;
  whatsapp: string;
  opening_hours: string;
  price_range: string;
  cover_image_url: string;
  is_featured: boolean;
  status: "pending" | "approved" | "rejected";
  commission_per_reservation: string;
};

const emptyForm: RestaurantInput = {
  name: "",
  cuisine: "",
  area: "",
  address: "",
  description: "",
  latitude: "",
  longitude: "",
  phone: "",
  whatsapp: "",
  opening_hours: "",
  price_range: "",
  cover_image_url: "",
  is_featured: false,
  status: "approved",
  commission_per_reservation: "",
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function toPayload(input: RestaurantInput) {
  return {
    name: input.name,
    cuisine: input.cuisine || null,
    area: input.area || null,
    address: input.address || null,
    description: input.description || null,
    latitude: input.latitude ? Number(input.latitude) : null,
    longitude: input.longitude ? Number(input.longitude) : null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    opening_hours: input.opening_hours || null,
    price_range: input.price_range || null,
    cover_image_url: input.cover_image_url || null,
    image_url: input.cover_image_url || null,
    is_featured: input.is_featured,
    status: input.status,
    is_approved: input.status === "approved",
    commission_per_reservation: input.commission_per_reservation ? Number(input.commission_per_reservation) : null,
  };
}

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select(
          "id, name, cuisine, area, address, latitude, longitude, cover_image_url, image_url, is_approved, is_featured, is_open, status, commission_per_reservation",
        )
        .order("name");
      if (error) throw error;
      setRestaurants(data as AdminRestaurant[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load restaurants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  function startEdit(r: AdminRestaurant) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      cuisine: r.cuisine ?? "",
      area: r.area ?? "",
      address: r.address ?? "",
      description: "",
      latitude: r.latitude?.toString() ?? "",
      longitude: r.longitude?.toString() ?? "",
      phone: "",
      whatsapp: "",
      opening_hours: "",
      price_range: "",
      cover_image_url: r.cover_image_url ?? r.image_url ?? "",
      is_featured: r.is_featured,
      status: r.status,
      commission_per_reservation: r.commission_per_reservation?.toString() ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = toPayload(form);
    const { error } = editingId
      ? await supabase.from("restaurants").update(payload).eq("id", editingId)
      : await supabase.from("restaurants").insert({ ...payload, slug: slugify(form.name) });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    resetForm();
    load();
  }

  async function toggle(id: string, field: "is_open" | "is_featured", current: boolean) {
    await supabase
      .from("restaurants")
      .update({ [field]: !current })
      .eq("id", id);
    load();
  }

  async function cycleStatus(id: string, current: AdminRestaurant["status"]) {
    const next = current === "approved" ? "pending" : current === "pending" ? "rejected" : "approved";
    await supabase
      .from("restaurants")
      .update({ status: next, is_approved: next === "approved" })
      .eq("id", id);
    load();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => (showForm ? resetForm() : setShowForm(true))}
        className="mb-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {showForm ? "Close form" : "+ Add restaurant"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Cuisine" value={form.cuisine} onChange={(v) => setForm({ ...form, cuisine: v })} />
          <Field label="Area" value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            span2
          />
          <Field label="Latitude" type="number" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} />
          <Field label="Longitude" type="number" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field
            label="Opening hours"
            value={form.opening_hours}
            onChange={(v) => setForm({ ...form, opening_hours: v })}
          />
          <Field
            label="Price range (e.g. $$)"
            value={form.price_range}
            onChange={(v) => setForm({ ...form, price_range: v })}
          />
          <Field
            label="Cover image URL"
            value={form.cover_image_url}
            onChange={(v) => setForm({ ...form, cover_image_url: v })}
            span2
          />
          <Field
            label="Commission per fulfilled reservation (BDT, leave blank for none)"
            type="number"
            value={form.commission_per_reservation}
            onChange={(v) => setForm({ ...form, commission_per_reservation: v })}
            span2
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RestaurantInput["status"] })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Update restaurant" : "Create restaurant"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading restaurants…</p>
      ) : error && restaurants.length === 0 ? (
        <p className="text-sm text-destructive">Couldn&apos;t load restaurants: {error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Cuisine</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Featured</th>
                <th className="py-2 pr-4">Open</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2 pr-4 font-medium">{r.name}</td>
                  <td className="py-2 pr-4">{r.cuisine ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => cycleStatus(r.id, r.status)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "approved"
                          ? "bg-secondary/20 text-secondary"
                          : r.status === "pending"
                            ? "bg-accent/30 text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {r.status}
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => toggle(r.id, "is_featured", r.is_featured)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.is_featured ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.is_featured ? "Featured" : "Not featured"}
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => toggle(r.id, "is_open", r.is_open)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.is_open ? "bg-secondary/20 text-secondary" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {r.is_open ? "Open" : "Closed"}
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-muted"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

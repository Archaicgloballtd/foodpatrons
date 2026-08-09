"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AD_SLOTS } from "@/lib/adSlots";

type AdminAd = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  slot: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
};

type AdInput = {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  slot: string;
  start_date: string;
  end_date: string;
  active: boolean;
};

const emptyForm: AdInput = {
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  slot: AD_SLOTS[0].key,
  start_date: "",
  end_date: "",
  active: true,
};

export default function AdminAds() {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AdInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("id, title, description, image_url, link_url, slot, active, start_date, end_date")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAds(data as AdminAd[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load ads.");
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
    const { error } = await supabase.from("ads").insert({
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      slot: form.slot,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      active: form.active,
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
    await supabase.from("ads").update({ active: !current }).eq("id", id);
    load();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="mb-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {showForm ? "Close form" : "+ Add advertisement"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <label className="flex flex-col gap-1 text-sm">
            Slot
            <select
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {AD_SLOTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            span2
          />
          <Field
            label="Image URL"
            value={form.image_url}
            onChange={(v) => setForm({ ...form, image_url: v })}
            span2
          />
          <Field
            label="Link URL"
            value={form.link_url}
            onChange={(v) => setForm({ ...form, link_url: v })}
            span2
          />
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
              {saving ? "Saving…" : "Add ad"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading ads…</p>
      ) : error && ads.length === 0 ? (
        <p className="text-sm text-destructive">Couldn&apos;t load ads: {error}</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ads yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ads.map((ad) => (
            <li
              key={ad.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-semibold">{ad.title}</p>
                <p className="text-xs text-muted-foreground">
                  {AD_SLOTS.find((s) => s.key === ad.slot)?.label ?? ad.slot} ·{" "}
                  {ad.active ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(ad.id, ad.active)}
                className="shrink-0 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-white hover:bg-foreground/80"
              >
                {ad.active ? "Deactivate" : "Activate"}
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

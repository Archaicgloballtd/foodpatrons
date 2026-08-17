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
  restaurant_id: string | null;
  price_amount: number | null;
  currency: string;
  payment_status: "unpaid" | "pending_review" | "paid";
  requested_at: string | null;
  restaurants: { name: string } | null;
  impressions: number;
  clicks: number;
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
        .select(
          "id, title, description, image_url, link_url, slot, active, start_date, end_date, restaurant_id, price_amount, currency, payment_status, requested_at, restaurants(name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as Omit<AdminAd, "impressions" | "clicks">[];
      const counts = await Promise.all(
        rows.map(async (ad) => {
          const [impressions, clicks] = await Promise.all([
            supabase.from("ad_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "impression"),
            supabase.from("ad_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "click"),
          ]);
          return { impressions: impressions.count ?? 0, clicks: clicks.count ?? 0 };
        }),
      );

      setAds(rows.map((ad, i) => ({ ...ad, ...counts[i] })));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load ads.");
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(id: string) {
    await supabase.from("ads").update({ payment_status: "paid", active: true }).eq("id", id);
    load();
  }

  async function declineRequest(id: string) {
    if (!window.confirm("Decline and remove this ad request?")) return;
    await supabase.from("ads").delete().eq("id", id);
    load();
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

  const pending = ads.filter((ad) => ad.payment_status === "pending_review");

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-foreground">Pending restaurant requests ({pending.length})</h3>
          <div className="flex flex-col gap-2">
            {pending.map((ad) => (
              <div key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{ad.restaurants?.name ?? "Unknown restaurant"}</p>
                  <p className="text-xs text-muted-foreground">
                    {AD_SLOTS.find((s) => s.key === ad.slot)?.label ?? ad.slot} · {ad.currency} {ad.price_amount?.toLocaleString() ?? "—"}/mo
                    {ad.requested_at && ` · requested ${new Date(ad.requested_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => approveRequest(ad.id)}
                    className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    Approve &amp; activate
                  </button>
                  <button
                    type="button"
                    onClick={() => declineRequest(ad.id)}
                    className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {ad.restaurant_id && ` · ${ad.impressions} views, ${ad.clicks} clicks`}
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

"use client";

import { useEffect, useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";

type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  area: string | null;
  venue_name: string | null;
  source_url: string | null;
  source_label: string | null;
};

type RestaurantOption = { id: string; name: string };

type EventInput = {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  area: string;
  venue_name: string;
  restaurant_id: string;
  image_url: string;
  source_url: string;
  source_label: string;
};

const emptyForm: EventInput = {
  title: "",
  description: "",
  event_date: "",
  event_time: "",
  area: "",
  venue_name: "",
  restaurant_id: "",
  image_url: "",
  source_url: "",
  source_label: "",
};

export default function AdminEvents() {
  const { user } = useSession();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [eventsRes, restaurantsRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, event_date, event_time, area, venue_name, source_url, source_label")
        .order("event_date", { ascending: false }),
      supabase.from("restaurants").select("id, name").order("name"),
    ]);
    setEvents((eventsRes.data as AdminEvent[]) ?? []);
    setRestaurants((restaurantsRes.data as RestaurantOption[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      event_time: form.event_time || null,
      area: form.area || null,
      venue_name: form.venue_name || null,
      restaurant_id: form.restaurant_id || null,
      image_url: form.image_url || null,
      source_url: form.source_url || null,
      source_label: form.source_label || null,
      created_by: user.id,
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

  async function handleDelete(id: string) {
    if (!confirm("Remove this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        There&apos;s no automated Facebook Events feed here — Meta&apos;s Events API needs app review and
        business verification we don&apos;t have, and scraping Facebook isn&apos;t something this site does.
        Post events manually as you find them (Facebook, restaurant pages, news), and use the source link so
        visitors can check the original.
      </p>

      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="mb-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {showForm ? "Close form" : "+ Add event"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        >
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required span2 />
          <Field
            label="Date"
            type="date"
            value={form.event_date}
            onChange={(v) => setForm({ ...form, event_date: v })}
            required
          />
          <Field
            label="Time (e.g. 7:00 PM, or 'Every Friday')"
            value={form.event_time}
            onChange={(v) => setForm({ ...form, event_time: v })}
          />
          <Field label="Area" value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
          <Field
            label="Venue name"
            value={form.venue_name}
            onChange={(v) => setForm({ ...form, venue_name: v })}
          />
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Link to a restaurant on the site (optional)
            <select
              value={form.restaurant_id}
              onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Not linked</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
          <Field label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} span2 />
          <Field
            label="Source URL (Facebook event, article, etc.)"
            value={form.source_url}
            onChange={(v) => setForm({ ...form, source_url: v })}
          />
          <Field
            label="Source label (e.g. 'via Facebook')"
            value={form.source_label}
            onChange={(v) => setForm({ ...form, source_label: v })}
          />

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add event"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{ev.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ev.event_date).toLocaleDateString()} {ev.event_time ?? ""} ·{" "}
                  {ev.venue_name ?? ev.area ?? "Dhaka"}
                  {ev.source_url && (
                    <>
                      {" · "}
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 underline"
                      >
                        source <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(ev.id)}
                aria-label="Delete event"
                className="shrink-0 rounded-full p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
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

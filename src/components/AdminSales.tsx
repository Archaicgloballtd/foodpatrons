"use client";

import { useEffect, useState } from "react";
import { Copy, Check, X, Mail, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

type QueueItem = {
  id: string;
  message: string;
  status: "pending" | "contacted" | "claimed" | "dismissed";
  created_at: string;
  emailed_at: string | null;
  email_error: string | null;
  restaurants: { name: string; area: string | null; email: string | null } | null;
};

export default function AdminSales() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  async function load() {
    setLoading(true);
    let query = supabase
      .from("outreach_queue")
      .select("id, message, status, created_at, emailed_at, email_error, restaurants(name, area, email)")
      .order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("status", "pending");
    const { data: initialData, error } = await query;
    let data = initialData;
    if (error) {
      // emailed_at/email_error/restaurants.email don't exist until
      // outreach_email_and_newsletter.sql has run — fall back gracefully so
      // the queue itself still works.
      let fallback = supabase
        .from("outreach_queue")
        .select("id, message, status, created_at, restaurants(name, area)")
        .order("created_at", { ascending: false });
      if (filter === "pending") fallback = fallback.eq("status", "pending");
      const retry = await fallback;
      if (retry.error) {
        setError(retry.error.message);
        setLoading(false);
        return;
      }
      data = (retry.data ?? []).map((item) => ({
        ...item,
        emailed_at: null,
        email_error: null,
        restaurants: item.restaurants ? { ...item.restaurants, email: null } : null,
      })) as unknown as typeof data;
    }
    setItems((data as unknown as QueueItem[]) ?? []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/filter change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(id: string, status: QueueItem["status"]) {
    await supabase.from("outreach_queue").update({ status }).eq("id", id);
    load();
  }

  async function copyMessage(item: QueueItem) {
    await navigator.clipboard.writeText(item.message);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function sendEmailToRestaurant(item: QueueItem) {
    if (!item.restaurants?.email) return;
    if (!window.confirm(`Send this outreach email to ${item.restaurants.name} (${item.restaurants.email})?`)) return;
    setSendingId(item.id);
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch("/api/send-outreach-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachId: item.id, accessToken: session.session?.access_token }),
    });
    const result = await res.json();
    setSendingId(null);
    if (!result.ok) {
      window.alert(`Couldn't send: ${result.error ?? "unknown error"}`);
    }
    load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading outreach queue…</p>}
      {error && <p className="text-sm text-destructive">Couldn&apos;t load outreach queue: {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing here. Run <code>node scripts/agent-sales.js</code> to draft outreach messages for unclaimed
          restaurants.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{item.restaurants?.name ?? "Unknown restaurant"}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.status === "pending"
                        ? "bg-muted text-muted-foreground"
                        : item.status === "claimed"
                          ? "bg-secondary/15 text-secondary"
                          : item.status === "contacted"
                            ? "bg-accent/15 text-accent-foreground"
                            : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.restaurants?.area && <p className="text-xs text-muted-foreground">{item.restaurants.area}</p>}
                <p className="mt-2 text-sm text-foreground/80">{item.message}</p>
                {item.restaurants?.email ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {item.restaurants.email}
                    {item.emailed_at && (
                      <span className="text-secondary"> · emailed {new Date(item.emailed_at).toLocaleDateString()}</span>
                    )}
                    {item.email_error && <span className="text-destructive"> · last send failed: {item.email_error}</span>}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No email on file for this restaurant — use Copy for manual outreach.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {item.restaurants?.email && (
                  <button
                    type="button"
                    onClick={() => sendEmailToRestaurant(item)}
                    disabled={sendingId === item.id}
                    className="flex items-center justify-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingId === item.id ? "Sending…" : item.emailed_at ? "Resend" : "Send email"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copyMessage(item)}
                  className="flex items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === item.id ? "Copied" : "Copy"}
                </button>
                {item.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => setStatus(item.id, "contacted")}
                    className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                  >
                    Mark contacted
                  </button>
                )}
                {item.status !== "dismissed" && item.status !== "claimed" && (
                  <button
                    type="button"
                    onClick={() => setStatus(item.id, "dismissed")}
                    className="flex items-center justify-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

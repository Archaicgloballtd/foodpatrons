"use client";

import { useEffect, useState } from "react";
import { BellRing, X, Check, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeInsert } from "@/lib/useRealtimeInsert";
import { playChime, notifyBrowser } from "@/lib/notify";

type Application = {
  id: string;
  user_id: string;
  restaurant_name: string;
  contact_phone: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  restaurant_id: string | null;
};

type RestaurantOption = { id: string; name: string };

const NEW_RESTAURANT = "__new__";

function notifyApplicant(type: "application_approved" | "application_rejected", applicationId: string) {
  fetch("/api/notify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, applicationId }),
  }).catch(() => {});
}

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

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [appsRes, restaurantsRes] = await Promise.all([
      supabase
        .from("restaurant_applications")
        .select("id, user_id, restaurant_name, contact_phone, message, status, admin_note, created_at, restaurant_id")
        .order("created_at", { ascending: false }),
      supabase.from("restaurants").select("id, name").order("name"),
    ]);
    const apps = (appsRes.data as Application[]) ?? [];
    setApplications(apps);
    setRestaurants((restaurantsRes.data as RestaurantOption[]) ?? []);

    if (apps.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", apps.map((a) => a.user_id));
      const map: Record<string, string> = {};
      for (const p of profiles ?? []) map[p.id] = p.full_name ?? "—";
      setApplicantNames(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  useRealtimeInsert<Application>("restaurant_applications", "status=eq.pending", (row) => {
    setApplications((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
    setToast(`New restaurant application: ${row.restaurant_name}`);
    playChime();
    notifyBrowser("New restaurant application", `${row.restaurant_name} wants to join foodpatrons.`);
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function approve(app: Application) {
    setBusyId(app.id);
    setError("");
    try {
      // Applicant already claimed a specific listing at signup — trust that
      // over the create/link dropdown, which only applies when they typed a
      // brand-new restaurant name instead.
      let restaurantId: string | null = app.restaurant_id;

      if (!restaurantId) {
        const choice = linkChoice[app.id] ?? NEW_RESTAURANT;
        restaurantId = choice;

        if (choice === NEW_RESTAURANT) {
          const { data: created, error: createErr } = await supabase
            .from("restaurants")
            .insert({ name: app.restaurant_name, status: "pending", slug: slugify(app.restaurant_name) })
            .select("id")
            .single();
          if (createErr) throw createErr;
          restaurantId = created.id;
        }
      }

      const { error: staffErr } = await supabase
        .from("restaurant_staff")
        .insert({ restaurant_id: restaurantId, user_id: app.user_id });
      if (staffErr) throw staffErr;

      const { error: roleErr } = await supabase.from("profiles").update({ role: "staff" }).eq("id", app.user_id);
      if (roleErr) throw roleErr;

      const { error: appErr } = await supabase
        .from("restaurant_applications")
        .update({ status: "approved", restaurant_id: restaurantId, reviewed_at: new Date().toISOString() })
        .eq("id", app.id);
      if (appErr) throw appErr;

      notifyApplicant("application_approved", app.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't approve this application.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(app: Application) {
    setBusyId(app.id);
    setError("");
    const { error } = await supabase
      .from("restaurant_applications")
      .update({ status: "rejected", admin_note: rejectNote || null, reviewed_at: new Date().toISOString() })
      .eq("id", app.id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    notifyApplicant("application_rejected", app.id);
    setRejecting(null);
    setRejectNote("");
    load();
  }

  const filtered = statusFilter === "all" ? applications : applications.filter((a) => a.status === statusFilter);

  return (
    <div>
      {toast && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground">
          <span className="flex items-center gap-2">
            <BellRing className="h-4 w-4 shrink-0 text-primary" />
            {toast}
          </span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="shrink-0 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="mb-4 text-xs text-muted-foreground">
        New applications trigger a live notification here while this tab is open. Applicants are
        emailed automatically on approve/reject once a RESEND_API_KEY is configured — until then
        this is silently skipped.
      </p>

      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {statusFilter !== "all" ? statusFilter : ""} applications.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => (
            <div key={app.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{app.restaurant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Applicant: {applicantNames[app.user_id] ?? "…"}
                    {app.contact_phone && ` · ${app.contact_phone}`}
                  </p>
                  {app.message && <p className="mt-1 text-xs text-muted-foreground">&quot;{app.message}&quot;</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(app.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    app.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : app.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {app.status}
                </span>
              </div>

              {app.status === "pending" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {app.restaurant_id ? (
                    <span className="rounded-lg bg-secondary/10 px-2.5 py-1.5 text-xs font-semibold text-secondary">
                      Claiming existing listing: {app.restaurant_name}
                    </span>
                  ) : (
                    <select
                      value={linkChoice[app.id] ?? NEW_RESTAURANT}
                      onChange={(e) => setLinkChoice({ ...linkChoice, [app.id]: e.target.value })}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      <option value={NEW_RESTAURANT}>Create new listing: &quot;{app.restaurant_name}&quot;</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          Link to existing: {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => approve(app)}
                    disabled={busyId === app.id}
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  {rejecting === app.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Reason (optional)"
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => reject(app)}
                        disabled={busyId === app.id}
                        className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 disabled:opacity-60"
                      >
                        Confirm reject
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRejecting(app.id)}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-muted"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

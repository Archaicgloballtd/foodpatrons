"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Store, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "customer" | "staff" | "admin";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  created_at: string;
};

type RestaurantOption = { id: string; name: string };

const ROLE_BADGE: Record<Role, { bg: string; text: string; icon: typeof UserIcon }> = {
  customer: { bg: "bg-muted", text: "text-foreground/70", icon: UserIcon },
  staff: { bg: "bg-secondary/10", text: "text-secondary", icon: Store },
  admin: { bg: "bg-primary/10", text: "text-primary", icon: ShieldCheck },
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({}); // user_id -> restaurant_id
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Record<string, { role: Role; restaurantId: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [profilesRes, restaurantsRes, staffRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }),
      supabase.from("restaurants").select("id, name").order("name"),
      supabase.from("restaurant_staff").select("user_id, restaurant_id"),
    ]);

    if (profilesRes.error) {
      setError(profilesRes.error.message);
      setLoading(false);
      return;
    }

    const rows = (profilesRes.data as Profile[]) ?? [];
    setProfiles(rows);
    setRestaurants((restaurantsRes.data as RestaurantOption[]) ?? []);

    const map: Record<string, string> = {};
    for (const s of staffRes.data ?? []) map[s.user_id] = s.restaurant_id;
    setStaffMap(map);

    const initialPending: Record<string, { role: Role; restaurantId: string }> = {};
    for (const p of rows) {
      initialPending[p.id] = { role: p.role, restaurantId: map[p.id] ?? "" };
    }
    setPending(initialPending);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout admin components
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q),
    );
  }, [profiles, query]);

  function updatePending(userId: string, patch: Partial<{ role: Role; restaurantId: string }>) {
    setPending((prev) => ({ ...prev, [userId]: { ...prev[userId], ...patch } }));
  }

  async function handleSave(userId: string) {
    const change = pending[userId];
    if (!change) return;
    setSaving(userId);
    setError("");

    const { error: roleError } = await supabase.from("profiles").update({ role: change.role }).eq("id", userId);
    if (roleError) {
      setError(roleError.message);
      setSaving(null);
      return;
    }

    // Keep restaurant_staff in sync: remove any existing link, then re-add
    // if they're (still) staff of a restaurant. Avoids a user staying
    // attached to a restaurant after being demoted, or ending up attached
    // to two restaurants at once.
    await supabase.from("restaurant_staff").delete().eq("user_id", userId);
    if (change.role === "staff" && change.restaurantId) {
      const { error: staffError } = await supabase
        .from("restaurant_staff")
        .insert({ user_id: userId, restaurant_id: change.restaurantId });
      if (staffError) {
        setError(staffError.message);
        setSaving(null);
        return;
      }
    }

    setSaving(null);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading users…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        {filtered.map((p) => {
          const change = pending[p.id] ?? { role: p.role, restaurantId: staffMap[p.id] ?? "" };
          const dirty = change.role !== p.role || change.restaurantId !== (staffMap[p.id] ?? "");
          const badge = ROLE_BADGE[p.role];

          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-foreground">{p.full_name || "Unnamed user"}</p>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${badge.bg} ${badge.text}`}>
                    <badge.icon className="h-3 w-3" />
                    {p.role}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{p.email || "no email on file"}</p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <select
                  value={change.role}
                  onChange={(e) => updatePending(p.id, { role: e.target.value as Role })}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Restaurant staff</option>
                  <option value="admin">Admin</option>
                </select>

                {change.role === "staff" && (
                  <select
                    value={change.restaurantId}
                    onChange={(e) => updatePending(p.id, { restaurantId: e.target.value })}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                  >
                    <option value="">Select restaurant…</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(p.id)}
                  disabled={!dirty || saving === p.id || (change.role === "staff" && !change.restaurantId)}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                >
                  {saving === p.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No users match that search.</p>}
      </div>
    </div>
  );
}

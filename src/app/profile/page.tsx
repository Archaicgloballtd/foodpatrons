"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Bell, BellRing, Heart, Trash2, LogOut, Store, ShieldCheck, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { signOut, useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { tierForPoints, nextTier, POINTS_INFO } from "@/lib/membership";

const SAVED_KEY = "fp_saved_restaurant_ids";

function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the edit form to freshly-loaded profile data, not derivable from render inputs
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
  }, [profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only APIs (Notification, localStorage) unavailable during server render
    setNotifPermission("Notification" in window ? Notification.permission : "unsupported");
    try {
      const ids = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
      setSavedCount(Array.isArray(ids) ? ids.length : 0);
    } catch {
      setSavedCount(0);
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, phone: phone || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  function clearSaved() {
    window.localStorage.removeItem(SAVED_KEY);
    setSavedCount(0);
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-6 py-16 text-center text-sm text-muted-foreground">Loading…</main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to save your details, manage notification settings, and keep track of your
            bookings in one place. Browsing, reserving, and claiming offers still work without an
            account.
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-secondary-foreground">
            {initialsFor(profile?.full_name, user.email)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || "Your profile"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.role && profile.role !== "customer" && (
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
                {profile.role}
              </span>
            )}
          </div>
        </div>

        {(profile?.role === "staff" || profile?.role === "admin") && (
          <div className="mt-5 flex flex-wrap gap-2">
            {(profile.role === "staff" || profile.role === "admin") && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                <Store className="h-4 w-4 text-primary" />
                Restaurant dashboard
              </Link>
            )}
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin dashboard
              </Link>
            )}
          </div>
        )}

        {/* Membership */}
        {profile && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
                <Award className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{tierForPoints(profile.points)} member</h2>
                <p className="text-xs text-muted-foreground">{profile.points} points earned</p>
              </div>
            </div>
            {(() => {
              const next = nextTier(profile.points);
              if (!next) {
                return <p className="mt-3 text-xs text-muted-foreground">You&apos;ve reached the top tier.</p>;
              }
              return (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${next.progressPct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {next.pointsNeeded} more point{next.pointsNeeded === 1 ? "" : "s"} to reach {next.tier}
                  </p>
                </div>
              );
            })()}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {POINTS_INFO.map((p) => (
                <span
                  key={p.action}
                  className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-foreground/70"
                >
                  +{p.points} · {p.action}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Basic profile */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">Basic profile</h2>
          <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                disabled
                value={user.email ?? ""}
                className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-secondary">Saved.</p>}
            <button
              type="submit"
              disabled={saving}
              className="mt-1 self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>

        {/* Settings & privacy */}
        <section id="settings" className="mt-6 scroll-mt-20 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">Settings &amp; privacy</h2>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {notifPermission === "granted" ? (
                  <BellRing className="h-4 w-4 text-primary" />
                ) : (
                  <Bell className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Desktop notifications</p>
                <p className="text-xs text-muted-foreground">
                  {notifPermission === "granted"
                    ? "Enabled — restaurant staff and admins get live alerts for new activity."
                    : notifPermission === "denied"
                      ? "Blocked in your browser settings."
                      : notifPermission === "unsupported"
                        ? "Not supported in this browser."
                        : "Off — only relevant if you manage a restaurant."}
                </p>
              </div>
            </div>
            {notifPermission === "default" && (
              <button
                type="button"
                onClick={enableNotifications}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted"
              >
                Enable
              </button>
            )}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Saved restaurants</p>
                <p className="text-xs text-muted-foreground">
                  {savedCount} saved on this device — stored locally, not tied to your account.
                </p>
              </div>
            </div>
            {savedCount > 0 && (
              <button
                type="button"
                onClick={clearSaved}
                className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

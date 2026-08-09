"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon, Settings, Heart, CalendarCheck, ShieldCheck, Store, LogOut, Award } from "lucide-react";
import { signOut, useSession } from "@/lib/auth";
import { tierForPoints } from "@/lib/membership";

function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export default function NavProfileMenu() {
  const router = useRouter();
  const { user, profile } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const initials = initialsFor(profile?.full_name, user.email);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {profile?.full_name || "foodpatrons user"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            {profile && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                <Award className="h-3 w-3" />
                {tierForPoints(profile.points)} · {profile.points} pts
              </span>
            )}
          </div>
          <div className="flex flex-col py-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              My profile
            </Link>
            <Link
              href="/profile#settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings &amp; privacy
            </Link>
            <Link
              href="/saved"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              <Heart className="h-4 w-4 text-muted-foreground" />
              Saved restaurants
            </Link>
            <Link
              href="/bookings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              My bookings
            </Link>

            {(profile?.role === "staff" || profile?.role === "admin") && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                <Store className="h-4 w-4 text-muted-foreground" />
                Restaurant dashboard
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Admin dashboard
              </Link>
            )}
          </div>
          <div className="border-t border-border py-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

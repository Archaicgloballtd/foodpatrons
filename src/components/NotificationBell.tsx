"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications";
import { useRealtimeInsert } from "@/lib/useRealtimeInsert";
import { playChime, notifyBrowser } from "@/lib/notify";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getNotifications().then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useRealtimeInsert<AppNotification>(
    "notifications",
    user ? `user_id=eq.${user.id}` : "user_id=eq.none",
    (row) => {
      setItems((prev) => [row, ...prev]);
      playChime();
      notifyBrowser(row.title, row.body ?? "");
    },
  );

  if (!user) return null;

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleOpenNotification(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)));
      await markNotificationRead(n.id);
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    await markAllNotificationsRead(user.id);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/80 hover:bg-accent/30"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {loaded && items.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nothing yet — you&apos;re all caught up.</p>
            )}
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.link || "#"}
                onClick={() => handleOpenNotification(n)}
                className={`block border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-muted ${
                  n.read ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <div className="min-w-0">
                    <p className={`truncate font-semibold text-foreground ${n.read ? "" : ""}`}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

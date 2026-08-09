"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeInsert } from "@/lib/useRealtimeInsert";
import { playChime, notifyBrowser } from "@/lib/notify";

type Reservation = {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: "pending" | "confirmed" | "cancelled";
};

export default function DashboardReservations({ restaurantId }: { restaurantId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reservations")
      .select("id, code, customer_name, customer_phone, party_size, reservation_date, reservation_time, status")
      .eq("restaurant_id", restaurantId)
      .order("reservation_date", { ascending: true });
    setReservations(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    setPermission("Notification" in window ? Notification.permission : "unsupported");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useRealtimeInsert<Reservation>("reservations", `restaurant_id=eq.${restaurantId}`, (row) => {
    setReservations((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
    setToast(`New reservation from ${row.customer_name} — party of ${row.party_size} on ${row.reservation_date}`);
    playChime();
    notifyBrowser("New reservation", `${row.customer_name} — party of ${row.party_size}, ${row.reservation_date} ${row.reservation_time}`);
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    await supabase.from("reservations").update({ status }).eq("id", id);
    load();
  }

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

      {permission === "default" && (
        <button
          type="button"
          onClick={enableNotifications}
          className="mb-4 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-muted"
        >
          <Bell className="h-3.5 w-3.5" />
          Enable desktop notifications for new reservations
        </button>
      )}
      {permission === "granted" && (
        <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-secondary">
          <BellRing className="h-3.5 w-3.5" />
          You&apos;ll get a notification here when a new reservation comes in — keep this tab open.
        </p>
      )}
      {permission === "denied" && (
        <p className="mb-4 text-xs text-muted-foreground">
          Desktop notifications are blocked in your browser settings. This list still updates live while the page is open.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reservations…</p>
      ) : reservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reservations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Party</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2 pr-4 font-mono text-xs">{r.code}</td>
                  <td className="py-2 pr-4">{r.customer_name}</td>
                  <td className="py-2 pr-4">{r.customer_phone}</td>
                  <td className="py-2 pr-4">{r.party_size}</td>
                  <td className="py-2 pr-4">{r.reservation_date}</td>
                  <td className="py-2 pr-4">{r.reservation_time}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : r.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(r.id, "confirmed")}
                          className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(r.id, "cancelled")}
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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

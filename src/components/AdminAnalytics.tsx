"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Eye, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Session = {
  session_id: string;
  user_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
  duration_seconds: number;
  entry_path: string | null;
  referrer: string | null;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AdminAnalytics() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topPaths, setTopPaths] = useState<{ path: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [sessionsRes, eventsRes] = await Promise.all([
        supabase
          .from("analytics_sessions")
          .select("session_id, user_id, first_seen_at, last_seen_at, duration_seconds, entry_path, referrer")
          .gte("first_seen_at", since)
          .order("last_seen_at", { ascending: false })
          .limit(200),
        supabase.from("analytics_events").select("path").gte("created_at", since).limit(2000),
      ]);

      setSessions(sessionsRes.data ?? []);

      const counts = new Map<string, number>();
      for (const row of eventsRes.data ?? []) {
        counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
      }
      const ranked = Array.from(counts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setTopPaths(ranked);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;

  const totalSessions = sessions.length;
  const signedInSessions = sessions.filter((s) => s.user_id).length;
  const avgDuration =
    totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / totalSessions) : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionsToday = sessions.filter((s) => new Date(s.first_seen_at) >= today).length;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted-foreground">
        Last 30 days, most recent 200 sessions. Collected silently in the background per the{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          privacy policy
        </a>
        .
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold">Sessions (30d)</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{totalSessions}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-semibold">Signed-in sessions</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{signedInSessions}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">Avg. time on site</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{formatDuration(avgDuration)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-semibold">Sessions today</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{sessionsToday}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Top pages</h3>
        <div className="mt-2 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {topPaths.length === 0 && <p className="p-4 text-sm text-muted-foreground">No page views yet.</p>}
          {topPaths.map(({ path, count }) => (
            <div key={path} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-mono text-foreground/80">{path}</span>
              <span className="font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Recent sessions</h3>
        <div className="mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Last seen</th>
                <th className="px-4 py-2">Entry page</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Signed in</th>
                <th className="px-4 py-2">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.slice(0, 50).map((s) => (
                <tr key={s.session_id}>
                  <td className="px-4 py-2 text-foreground/80">{new Date(s.last_seen_at).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono text-foreground/80">{s.entry_path ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground/80">{formatDuration(s.duration_seconds)}</td>
                  <td className="px-4 py-2">{s.user_id ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 truncate text-foreground/60">{s.referrer || "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

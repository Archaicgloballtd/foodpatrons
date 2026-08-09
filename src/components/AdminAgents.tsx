"use client";

import { useEffect, useState } from "react";
import { Sparkles, MessageSquare, Database, Palette, Activity, Terminal, Megaphone, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminContent from "./AdminContent";
import AdminSales from "./AdminSales";
import AdminDataGaps from "./AdminDataGaps";
import AdminMarketing from "./AdminMarketing";

type AgentKey = "ops" | "growth" | "sales" | "data" | "design" | "marketing";

const AGENTS: { key: AgentKey; name: string; role: string; icon: typeof Sparkles }[] = [
  { key: "ops", name: "Agent Ops", role: "Daily status digest", icon: Activity },
  { key: "growth", name: "Agent Growth", role: "SEO guides & content", icon: Sparkles },
  { key: "marketing", name: "Agent Marketing", role: "Social captions & promos", icon: Megaphone },
  { key: "sales", name: "Agent Sales", role: "Restaurant outreach drafts", icon: MessageSquare },
  { key: "data", name: "Agent Data", role: "Listing completeness", icon: Database },
  { key: "design", name: "Agent Design", role: "Promo graphics", icon: Palette },
];

function OpsDigest() {
  const [stats, setStats] = useState<{ pendingOutreach: number; draftGuides: number; unclaimed: number } | null>(
    null,
  );

  useEffect(() => {
    async function load() {
      const [outreach, drafts, staff, restaurants] = await Promise.all([
        supabase.from("outreach_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("restaurant_staff").select("restaurant_id"),
        supabase.from("restaurants").select("*", { count: "exact", head: true }),
      ]);
      const claimedCount = new Set((staff.data ?? []).map((s) => s.restaurant_id)).size;
      setStats({
        pendingOutreach: outreach.count ?? 0,
        draftGuides: drafts.count ?? 0,
        unclaimed: (restaurants.count ?? 0) - claimedCount,
      });
    }
    load();
  }, []);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        What the other agents have queued up for you right now.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{stats?.pendingOutreach ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Outreach drafts awaiting review (Agent Sales)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{stats?.draftGuides ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Guide drafts awaiting publish (Agent Growth)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{stats?.unclaimed ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Restaurants still unclaimed</p>
        </div>
      </div>
    </div>
  );
}

function DesignPanel() {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.storage.from("design-assets").list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      const withUrls = (data ?? []).map((f) => ({
        name: f.name.replace(/\.jpg$/, "").replace(/-/g, " "),
        url: supabase.storage.from("design-assets").getPublicUrl(f.name).data.publicUrl,
      }));
      setFiles(withUrls);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Terminal className="h-4 w-4" />
          Generated automatically, weekly — or on request
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          On-brand, Instagram-square promo graphics for real restaurants already on foodpatrons — name, cuisine,
          area, rating, and price tier, all pulled from the database. No invented dishes or photos.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask in chat: <span className="font-semibold text-foreground">&quot;make a promo graphic for [restaurant]&quot;</span>{" "}
          — or run it yourself:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-3 text-xs">
          node scripts/agent-design.js &quot;Restaurant Name&quot;
        </pre>
      </div>

      <h3 className="mb-3 mt-6 text-sm font-bold text-foreground">Generated so far ({files.length})</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading gallery…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No graphics generated yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {files.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, no domain allowlist for MVP */}
              <img src={f.url} alt={f.name} className="aspect-square w-full object-cover" />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1 truncate text-xs font-semibold capitalize text-white">
                  <Download className="h-3 w-3 shrink-0" />
                  {f.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAgents() {
  const [tab, setTab] = useState<AgentKey>("ops");

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {AGENTS.map(({ key, name, role, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors ${
              tab === key ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <Icon className={`h-4 w-4 ${tab === key ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-bold text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </button>
        ))}
      </div>

      {tab === "ops" && <OpsDigest />}
      {tab === "growth" && <AdminContent />}
      {tab === "marketing" && <AdminMarketing />}
      {tab === "sales" && <AdminSales />}
      {tab === "data" && <AdminDataGaps />}
      {tab === "design" && <DesignPanel />}
    </div>
  );
}

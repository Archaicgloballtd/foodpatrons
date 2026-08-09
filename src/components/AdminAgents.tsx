"use client";

import { useEffect, useState } from "react";
import { Sparkles, MessageSquare, Database, Palette, Activity, Terminal, Megaphone } from "lucide-react";
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
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Terminal className="h-4 w-4" />
        Runs on request
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Agent Design builds an on-brand, Instagram-square promo graphic for any real restaurant already on
        foodpatrons — name, cuisine, area, rating, and price tier, all pulled from the database. No invented dishes
        or photos.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Ask in chat: <span className="font-semibold text-foreground">&quot;make a promo graphic for [restaurant]&quot;</span>{" "}
        — or run it yourself:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-3 text-xs">
        node scripts/agent-design.js &quot;Restaurant Name&quot;
      </pre>
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

"use client";

import { useEffect, useState } from "react";
import { Send, Users, History } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Campaign = { id: string; subject: string; recipient_count: number; sent_at: string };

export default function AdminNewsletter() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");
  const [tableMissing, setTableMissing] = useState(false);

  async function load() {
    const [subRes, campaignRes] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("newsletter_campaigns").select("id, subject, recipient_count, sent_at").order("sent_at", { ascending: false }).limit(5),
    ]);
    if (subRes.error) {
      setTableMissing(true);
      return;
    }
    setSubscriberCount(subRes.count ?? 0);
    setCampaigns(campaignRes.data ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    if (!subscriberCount) return;
    if (
      !window.confirm(
        `Send "${subject}" to all ${subscriberCount} active subscriber${subscriberCount === 1 ? "" : "s"}? This can't be undone.`,
      )
    )
      return;

    setSending(true);
    setResult("");
    const { data: session } = await supabase.auth.getSession();
    const html = body
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    const res = await fetch("/api/send-newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html, accessToken: session.session?.access_token }),
    });
    const data = await res.json();
    setSending(false);
    if (data.ok) {
      setResult(`Sent to ${data.sent}/${data.total} subscribers${data.failed ? ` (${data.failed} failed)` : ""}.`);
      setSubject("");
      setBody("");
      load();
    } else {
      setResult(`Couldn't send: ${data.error ?? "unknown error"}`);
    }
  }

  if (tableMissing) {
    return (
      <p className="text-sm text-muted-foreground">
        Newsletter tables aren&apos;t set up yet — run{" "}
        <code className="rounded bg-muted px-1">supabase/outreach_email_and_newsletter.sql</code> first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4">
        <Users className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-foreground">
          <span className="font-bold">{subscriberCount ?? "—"}</span> active subscriber
          {subscriberCount === 1 ? "" : "s"}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-foreground">Compose</h3>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the newsletter body. Separate paragraphs with a blank line."
            rows={6}
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || !subscriberCount}
            className="flex items-center justify-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : `Send to ${subscriberCount ?? 0} subscriber${subscriberCount === 1 ? "" : "s"}`}
          </button>
          {result && <p className="text-sm text-muted-foreground">{result}</p>}
          {!subscriberCount && (
            <p className="text-xs text-muted-foreground">No active subscribers yet — nothing to send to.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <History className="h-4 w-4" />
          Recent campaigns
        </h3>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing sent yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold text-foreground">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {c.recipient_count} recipient{c.recipient_count === 1 ? "" : "s"} ·{" "}
                  {new Date(c.sent_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

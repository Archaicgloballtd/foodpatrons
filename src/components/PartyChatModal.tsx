"use client";

import { useEffect, useRef, useState } from "react";
import { Send, LogOut, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeInsert } from "@/lib/useRealtimeInsert";
import type { Party, PartyMessage } from "@/lib/parties";
import Modal from "./Modal";

function initialsFor(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function PartyChatModal({
  party,
  userId,
  onClose,
  onLeft,
}: {
  party: Party;
  userId: string;
  onClose: () => void;
  onLeft: () => void;
}) {
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("party_messages")
      .select("id, party_id, sender_id, content, created_at, profiles(full_name)")
      .eq("party_id", party.id)
      .order("created_at", { ascending: true })
      .returns<PartyMessage[]>();
    setMessages(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [party.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useRealtimeInsert<PartyMessage>("party_messages", `party_id=eq.${party.id}`, (row) => {
    setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    await supabase.from("party_messages").insert({ party_id: party.id, sender_id: userId, content });
    setSending(false);
  }

  async function handleLeave() {
    if (!confirm("Leave this meetup?")) return;
    await supabase.from("party_members").delete().eq("party_id", party.id).eq("user_id", userId);
    onLeft();
  }

  return (
    <Modal title={party.title} onClose={onClose}>
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {party.party_members.length} joined
        </p>
        <button
          type="button"
          onClick={handleLeave}
          className="flex items-center gap-1 text-xs font-semibold text-destructive/70 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave
        </button>
      </div>

      <div className="mt-3 flex max-h-80 min-h-40 flex-col gap-3 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet — say hi!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {initialsFor(m.profiles?.full_name)}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {!mine && <p className="text-[11px] font-semibold opacity-70">{m.profiles?.full_name || "foodpatrons user"}</p>}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Message the group…"
          className="w-full flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </Modal>
  );
}

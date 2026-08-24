"use client";

import { useState } from "react";
import { PartyPopper } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";

export default function CreateMeetupModal({
  restaurantId,
  userId,
  onClose,
  onCreated,
}: {
  restaurantId: string;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function todayLocalISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const scheduledFor = new Date(`${date}T${time}`);
    const { data: party, error: insertError } = await supabase
      .from("parties")
      .insert({
        restaurant_id: restaurantId,
        creator_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        scheduled_for: scheduledFor.toISOString(),
        max_members: maxMembers ? Number(maxMembers) : null,
      })
      .select("id")
      .single();

    if (insertError || !party) {
      setSubmitting(false);
      setError(insertError?.message ?? "Couldn't create the meetup.");
      return;
    }

    // Creator auto-joins their own meetup.
    await supabase.from("party_members").insert({ party_id: party.id, user_id: userId });
    setSubmitting(false);
    onCreated();
  }

  return (
    <Modal title="Start a meetup here" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PartyPopper className="h-3.5 w-3.5 text-primary" />
          Anyone can see and join. You&apos;ll get a group chat with everyone who joins.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          What&apos;s the plan?
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday night biryani run"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Details (optional)
          <textarea
            maxLength={500}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Date
            <input
              type="date"
              required
              min={todayLocalISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Time
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Max people (optional)
          <input
            type="number"
            min={2}
            max={50}
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            placeholder="No limit"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="mt-2 h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create meetup"}
        </Button>
      </form>
    </Modal>
  );
}

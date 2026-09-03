"use client";

import { useEffect, useMemo, useState } from "react";
import { PartyPopper, Search, MapPin, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";

type RestaurantOption = { id: string; name: string; area: string | null; cuisine: string | null };

export default function CreateMeetupModal({
  restaurantId,
  userId,
  onClose,
  onCreated,
}: {
  /** Fixed restaurant (e.g. opened from that restaurant's own page). Omit to
   * let the user search and pick one first (e.g. opened from Community). */
  restaurantId?: string;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pickedRestaurant, setPickedRestaurant] = useState<RestaurantOption | null>(null);
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantOptions, setRestaurantOptions] = useState<RestaurantOption[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsPicker = !restaurantId;
  const effectiveRestaurantId = restaurantId ?? pickedRestaurant?.id;

  useEffect(() => {
    if (!needsPicker || restaurantsLoaded) return;
    supabase
      .from("restaurants")
      .select("id, name, area, cuisine")
      .order("name")
      .then(({ data }) => {
        setRestaurantOptions((data as RestaurantOption[]) ?? []);
        setRestaurantsLoaded(true);
      });
  }, [needsPicker, restaurantsLoaded]);

  const filteredRestaurantOptions = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    const list = !q ? restaurantOptions : restaurantOptions.filter((r) => [r.name, r.area, r.cuisine].some((f) => f?.toLowerCase().includes(q)));
    return list.slice(0, 8);
  }, [restaurantOptions, restaurantQuery]);

  function todayLocalISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveRestaurantId) {
      setError("Pick a restaurant first.");
      return;
    }
    setSubmitting(true);
    setError("");

    const scheduledFor = new Date(`${date}T${time}`);
    const { data: party, error: insertError } = await supabase
      .from("parties")
      .insert({
        restaurant_id: effectiveRestaurantId,
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
    <Modal title={needsPicker ? "Create a meetup" : "Start a meetup here"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PartyPopper className="h-3.5 w-3.5 text-primary" />
          Anyone can see and join. You&apos;ll get a group chat with everyone who joins.
        </p>

        {needsPicker && (
          <div className="flex flex-col gap-1 text-sm">
            Restaurant
            {pickedRestaurant ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{pickedRestaurant.name}</span>
                </span>
                <button type="button" onClick={() => setPickedRestaurant(null)} className="shrink-0 text-primary/70 hover:text-primary">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={restaurantQuery}
                    onChange={(e) => setRestaurantQuery(e.target.value)}
                    placeholder="Search by name, cuisine, or area"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                {restaurantQuery.trim() && (
                  <div className="mt-1 flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border">
                    {!restaurantsLoaded ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
                    ) : filteredRestaurantOptions.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No match.</p>
                    ) : (
                      filteredRestaurantOptions.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setPickedRestaurant(r);
                            setRestaurantQuery("");
                          }}
                          className="flex flex-col items-start px-3 py-1.5 text-left text-xs hover:bg-muted"
                        >
                          <span className="font-medium">{r.name}</span>
                          <span className="text-[11px] text-muted-foreground">{[r.cuisine, r.area].filter(Boolean).join(" · ")}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
          disabled={submitting || (needsPicker && !pickedRestaurant)}
          className="mt-2 h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create meetup"}
        </Button>
      </form>
    </Modal>
  );
}

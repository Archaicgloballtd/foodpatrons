"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, Plus, Clock, Users } from "lucide-react";
import { useSession } from "@/lib/auth";
import { getUpcomingParties, type PartyWithRestaurant } from "@/lib/parties";
import PartyMapLoader from "./PartyMapLoader";
import CreateMeetupModal from "./CreateMeetupModal";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return isToday ? `Today · ${time}` : `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
}

export default function CommunityMeetups() {
  const { user } = useSession();
  const [parties, setParties] = useState<PartyWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setParties(await getUpcomingParties(20));
      setTableMissing(false);
    } catch {
      setTableMissing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, [load]);

  if (tableMissing) return null; // migration not run yet — stay quiet, same as other optional features

  const unmapped = parties.filter((p) => p.restaurants?.latitude == null || p.restaurants?.longitude == null);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <PartyPopper className="h-4 w-4 text-primary" />
          Meetups near you
        </h2>
        {user ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            aria-label="Create a meetup"
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        ) : (
          <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
            Sign in to create
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : parties.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing planned yet — be the first to start a meetup at a restaurant you love.
        </p>
      ) : (
        <div className="mt-3">
          <PartyMapLoader parties={parties} onChanged={load} />
        </div>
      )}

      {unmapped.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Also happening (no map location on file):</p>
          {unmapped.map((p) => (
            <Link
              key={p.id}
              href={p.restaurants ? `/restaurant/${p.restaurants.id}` : "#"}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5 text-sm hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{p.title}</p>
                <p className="truncate text-xs text-muted-foreground">{p.restaurants?.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatWhen(p.scheduled_for)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {p.party_members.length}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && user && (
        <CreateMeetupModal
          userId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

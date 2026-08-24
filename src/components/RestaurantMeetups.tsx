"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, Users, Clock, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { getOpenPartiesForRestaurant, type Party } from "@/lib/parties";
import CreateMeetupModal from "./CreateMeetupModal";
import PartyChatModal from "./PartyChatModal";

function initialsFor(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function RestaurantMeetups({ restaurantId }: { restaurantId: string }) {
  const { user } = useSession();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openChatFor, setOpenChatFor] = useState<Party | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { error } = await supabase.from("parties").select("id").limit(1);
    if (error) {
      setTableMissing(true);
      setLoading(false);
      return;
    }
    setParties(await getOpenPartiesForRestaurant(restaurantId));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/restaurant change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function handleJoin(party: Party) {
    if (!user) return;
    setJoiningId(party.id);
    const { error } = await supabase.from("party_members").insert({ party_id: party.id, user_id: user.id });
    setJoiningId(null);
    if (!error) {
      await load();
      const fresh = await getOpenPartiesForRestaurant(restaurantId);
      setOpenChatFor(fresh.find((p) => p.id === party.id) ?? null);
    }
  }

  if (tableMissing) return null; // migration not run yet — fail quietly, same as other optional features

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <PartyPopper className="h-4 w-4 text-primary" />
          Meetups here
        </h2>
        {user ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            + Start a meetup
          </button>
        ) : (
          <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
            Sign in to start one
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      ) : parties.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No meetups here yet — be the first to start one.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {parties.map((party) => {
            const isMember = user ? party.party_members.some((m) => m.user_id === user.id) : false;
            const isFull = party.max_members !== null && party.party_members.length >= party.max_members;
            return (
              <div key={party.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-bold text-foreground">{party.title}</p>
                {party.description && <p className="mt-0.5 text-sm text-muted-foreground">{party.description}</p>}
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatWhen(party.scheduled_for)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      {party.party_members.slice(0, 5).map((m) => (
                        <div
                          key={m.user_id}
                          title={m.profiles?.full_name ?? undefined}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-bold text-secondary-foreground"
                        >
                          {initialsFor(m.profiles?.full_name)}
                        </div>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {party.party_members.length}
                      {party.max_members ? `/${party.max_members}` : ""}
                    </span>
                  </div>

                  {isMember ? (
                    <button
                      type="button"
                      onClick={() => setOpenChatFor(party)}
                      className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Open chat
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoin(party)}
                      disabled={!user || isFull || joiningId === party.id}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {isFull ? "Full" : joiningId === party.id ? "Joining…" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && user && (
        <CreateMeetupModal
          restaurantId={restaurantId}
          userId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}
      {openChatFor && user && (
        <PartyChatModal
          party={openChatFor}
          userId={user.id}
          onClose={() => setOpenChatFor(null)}
          onLeft={async () => {
            setOpenChatFor(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

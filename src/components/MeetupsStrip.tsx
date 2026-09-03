"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, Users, Clock, UtensilsCrossed } from "lucide-react";
import { getUpcomingParties, type PartyWithRestaurant } from "@/lib/parties";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return isToday ? `Today · ${time}` : `${d.toLocaleDateString(undefined, { weekday: "short" })} · ${time}`;
}

export default function MeetupsStrip() {
  const [parties, setParties] = useState<PartyWithRestaurant[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getUpcomingParties(10)
      .then((data) => setParties(data))
      .catch(() => setParties([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || parties.length === 0) return null; // no active meetups (or migration not run) — stay quiet, nothing to see

  return (
    <div className="mt-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        <PartyPopper className="h-4 w-4 text-primary" />
        Meetups happening now
      </h2>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {parties.map((party) => {
          const image = party.restaurants?.cover_image_url ?? party.restaurants?.image_url;
          return (
            <Link
              key={party.id}
              href={party.restaurants ? `/restaurant/${party.restaurants.id}` : "#"}
              className="w-56 shrink-0 overflow-hidden rounded-2xl border border-border bg-card hover:border-primary"
            >
              <div className="h-24 w-full bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- real restaurant photo, no domain allowlist for MVP
                  <img src={image} alt={party.restaurants?.name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UtensilsCrossed className="h-6 w-6 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-foreground">{party.title}</p>
                <p className="truncate text-xs text-muted-foreground">{party.restaurants?.name}</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatWhen(party.scheduled_for)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {party.party_members.length}
                    {party.max_members ? `/${party.max_members}` : ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

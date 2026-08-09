"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, MapPin, ExternalLink, LocateFixed } from "lucide-react";
import type { DhakaEvent } from "@/lib/events";
import { nearestArea } from "@/lib/areas";
import EmptyState from "./EmptyState";

type LocationStatus = "idle" | "loading" | "success" | "error";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function EventsExperience({
  events,
  error,
  autoLocate = false,
}: {
  events: DhakaEvent[];
  error: string | null;
  autoLocate?: boolean;
}) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [nearest, setNearest] = useState<string | null>(null);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearest(nearestArea({ lat: position.coords.latitude, lng: position.coords.longitude }));
        setLocationStatus("success");
      },
      () => setLocationStatus("error"),
      { timeout: 10000 },
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: kicks off geolocation only when arriving via a "near me" link, not on every render
    if (autoLocate) handleUseMyLocation();
  }, [autoLocate]);

  const sortedEvents = useMemo(() => {
    if (!nearest) return events;
    const near = events.filter((ev) => ev.area?.toLowerCase() === nearest.toLowerCase());
    const rest = events.filter((ev) => ev.area?.toLowerCase() !== nearest.toLowerCase());
    return [...near, ...rest];
  }, [events, nearest]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Events</h1>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locationStatus === "loading"}
          className="flex items-center gap-1.5 rounded-full border border-primary px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locationStatus === "loading"
            ? "Locating…"
            : nearest
              ? `Near ${nearest}`
              : "Show nearest first"}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Food festivals, pop-ups, and dining events around Dhaka — curated by our team, sourced and linked back to
        where we found them.
      </p>
      {locationStatus === "error" && (
        <p className="mt-2 text-xs font-medium text-destructive">
          Couldn&apos;t access your location. Check your browser permissions.
        </p>
      )}

      <div className="mt-6">
        {error && <EmptyState mascot="sad" title="Couldn't load events" description={error} />}
        {!error && events.length === 0 && (
          <EmptyState
            mascot="search"
            title="No upcoming events yet"
            description="Check back soon — new food events get added as we find them."
          />
        )}
        {sortedEvents.length > 0 && (
          <div className="flex flex-col gap-3">
            {sortedEvents.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.05 }}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {formatDate(ev.event_date).split(" ")[1]}
                  </span>
                  <span className="text-lg font-extrabold leading-tight">{new Date(ev.event_date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground">{ev.title}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {formatDate(ev.event_date)}
                      {ev.event_time ? ` · ${ev.event_time}` : ""}
                    </span>
                    {(ev.venue_name || ev.area) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[ev.venue_name, ev.restaurants?.name, ev.area].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  {ev.description && <p className="mt-2 text-sm text-foreground/80">{ev.description}</p>}
                  {ev.source_url && (
                    <a
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {ev.source_label || "Source"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

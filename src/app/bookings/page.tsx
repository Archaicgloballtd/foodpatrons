"use client";

import { useState } from "react";
import { Search, CalendarCheck, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";

type Reservation = {
  id: string;
  code: string;
  customer_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: "pending" | "confirmed" | "cancelled";
  restaurants: { name: string } | null;
};

type Claim = {
  id: string;
  code: string;
  status: "unused" | "used" | "expired";
  expires_at: string;
  restaurants: { name: string } | null;
  offers: { title: string } | null;
};

type SearchState = "idle" | "loading" | "done" | "error";

function ReservationStatusPill({ status }: { status: Reservation["status"] }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  } as const;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

function ClaimStatusPill({ status }: { status: Claim["status"] }) {
  const styles = {
    unused: "bg-yellow-100 text-yellow-700",
    used: "bg-green-100 text-green-700",
    expired: "bg-zinc-200 text-zinc-600",
  } as const;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

export default function BookingsPage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("lookup failed");
      const data = await res.json();
      setReservations(data.reservations ?? []);
      setClaims(data.claims ?? []);
      setState("done");
    } catch {
      setState("error");
    }
  }

  const hasResults = reservations.length > 0 || claims.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">Your bookings</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Look up a table reservation or offer claim with the phone number you used, or the
            confirmation code you were given (e.g. <span className="font-mono">FP-R-12345</span>{" "}
            or <span className="font-mono">FP-O-12345</span>).
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full border border-border bg-white p-1.5 pl-4 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Phone number or confirmation code"
            className="w-full flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          >
            {state === "loading" ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="mt-8">
          {state === "error" && (
            <EmptyState mascot="sad" title="Couldn't run that search" description="Please try again in a moment." />
          )}

          {state === "done" && !hasResults && (
            <EmptyState
              mascot="search"
              title="No bookings found"
              description="Double-check the phone number or code — or if you haven't booked anything yet, head back to Explore."
            />
          )}

          {state === "done" && hasResults && (
            <div className="flex flex-col gap-6">
              {reservations.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Reservations
                  </h2>
                  <div className="mt-3 flex flex-col gap-2">
                    {reservations.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{r.restaurants?.name ?? "Restaurant"}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {r.party_size} {r.party_size === 1 ? "person" : "people"} · {r.reservation_date} at{" "}
                              {r.reservation_time}
                            </p>
                          </div>
                          <ReservationStatusPill status={r.status} />
                        </div>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">{r.code}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {claims.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Tag className="h-4 w-4 text-primary" />
                    Offer claims
                  </h2>
                  <div className="mt-3 flex flex-col gap-2">
                    {claims.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{c.restaurants?.name ?? "Restaurant"}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{c.offers?.title ?? "Offer"}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Expires {new Date(c.expires_at).toLocaleString()}
                            </p>
                          </div>
                          <ClaimStatusPill status={c.status} />
                        </div>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">{c.code}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

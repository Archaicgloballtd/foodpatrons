"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { generateReservationCode, UNIQUE_VIOLATION } from "@/lib/codes";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";

type Step = "form" | "submitting" | "success" | "error";

function todayLocalISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReservationModal({
  restaurantId,
  restaurantName,
  restaurantImage,
  restaurantAddress,
  onClose,
}: {
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string | null;
  restaurantAddress?: string | null;
  onClose: () => void;
}) {
  const { user } = useSession();
  const [step, setStep] = useState<Step>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("submitting");
    setErrorMessage("");

    for (let attempt = 0; attempt < 3; attempt++) {
      const attemptCode = generateReservationCode();
      const { error } = await supabase.from("reservations").insert({
        restaurant_id: restaurantId,
        code: attemptCode,
        customer_name: name,
        customer_phone: phone,
        party_size: partySize,
        reservation_date: date,
        reservation_time: time,
        user_id: user?.id ?? null,
      });

      if (!error) {
        setCode(attemptCode);
        setStep("success");
        return;
      }

      if (error.code !== UNIQUE_VIOLATION) {
        setErrorMessage(error.message);
        setStep("error");
        return;
      }
      // unique_violation: loop and try another code
    }

    setErrorMessage("Couldn't generate a unique reservation code. Please try again.");
    setStep("error");
  }

  if (step === "success") {
    return (
      <Modal title="Reservation requested" onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15">
            <CheckCircle2 className="h-7 w-7 text-secondary" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Your reservation code</p>
          <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{code}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {restaurantName} has received your request for {partySize}{" "}
            {partySize === 1 ? "person" : "people"} on {date} at {time}. Status:{" "}
            <span className="font-medium text-foreground">pending</span> — the restaurant will
            confirm it shortly.
          </p>
          <Button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Reserve a table" onClose={onClose}>
      {/* Context header — confirms which restaurant you're booking before you fill anything in */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {restaurantImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotlinked URLs, no domain allowlist for MVP
            <img src={restaurantImage} alt={restaurantName} className="h-full w-full object-cover" />
          ) : (
            <UtensilsCrossed className="h-5 w-5 text-primary/60" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{restaurantName}</p>
          {restaurantAddress && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {restaurantAddress}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-1 text-sm">
          Number of people
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              aria-label="Fewer people"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/70 transition-colors hover:bg-muted active:scale-95 disabled:opacity-40"
              disabled={partySize <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center text-base font-bold text-foreground">
              {partySize} {partySize === 1 ? "person" : "people"}
            </span>
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.min(30, n + 1))}
              aria-label="More people"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/70 transition-colors hover:bg-muted active:scale-95 disabled:opacity-40"
              disabled={partySize >= 30}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            type="tel"
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        {step === "error" && <p className="text-sm text-destructive">{errorMessage}</p>}

        <Button
          type="submit"
          disabled={step === "submitting"}
          className="mt-2 h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {step === "submitting" ? "Submitting…" : "Request Reservation"}
        </Button>
      </form>
    </Modal>
  );
}

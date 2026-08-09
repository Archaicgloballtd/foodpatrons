"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { generateCouponCode, UNIQUE_VIOLATION } from "@/lib/codes";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";

type Step = "form" | "submitting" | "success" | "error";

const DEFAULT_VALIDITY_HOURS = 24;

export default function ClaimOfferModal({
  offerId,
  restaurantId,
  offerTitle,
  offerEndsAt,
  onClose,
}: {
  offerId: string;
  restaurantId: string;
  offerTitle: string;
  offerEndsAt: string | null;
  onClose: () => void;
}) {
  const { user } = useSession();
  const [step, setStep] = useState<Step>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [phone, setPhone] = useState("");

  function computeExpiry(): string {
    const defaultExpiry = new Date(Date.now() + DEFAULT_VALIDITY_HOURS * 60 * 60 * 1000);
    if (offerEndsAt) {
      const offerExpiry = new Date(offerEndsAt);
      if (offerExpiry.getTime() < defaultExpiry.getTime()) return offerExpiry.toISOString();
    }
    return defaultExpiry.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("submitting");
    setErrorMessage("");
    const expiry = computeExpiry();

    for (let attempt = 0; attempt < 3; attempt++) {
      const attemptCode = generateCouponCode();
      const { error } = await supabase.from("coupon_claims").insert({
        offer_id: offerId,
        restaurant_id: restaurantId,
        code: attemptCode,
        customer_phone: phone,
        expires_at: expiry,
        user_id: user?.id ?? null,
      });

      if (!error) {
        setCode(attemptCode);
        setExpiresAt(expiry);
        setStep("success");
        return;
      }

      if (error.code !== UNIQUE_VIOLATION) {
        setErrorMessage(error.message);
        setStep("error");
        return;
      }
    }

    setErrorMessage("Couldn't generate a unique coupon code. Please try again.");
    setStep("error");
  }

  if (step === "success") {
    return (
      <Modal title="Offer claimed" onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/25">
            <Tag className="h-7 w-7 text-accent-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Your coupon code</p>
          <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{code}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Show this code at the restaurant to redeem &quot;{offerTitle}&quot;. Valid until{" "}
            {new Date(expiresAt).toLocaleString()}.
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
    <Modal title={`Claim: ${offerTitle}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Phone number
          <input
            type="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 017XXXXXXXX"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          We ask for your phone number so the restaurant can verify your coupon.
        </p>

        {step === "error" && <p className="text-sm text-destructive">{errorMessage}</p>}

        <Button
          type="submit"
          disabled={step === "submitting"}
          className="mt-2 h-12 w-full rounded-full bg-secondary text-base font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60"
        >
          {step === "submitting" ? "Claiming…" : "Claim Offer"}
        </Button>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase(), source: "footer" });
    if (insertError) {
      // Unique-constraint hit just means they're already subscribed — treat
      // that as success rather than showing a confusing DB error.
      if (insertError.code === "23505") {
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(insertError.message);
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
        <Check className="h-4 w-4 text-secondary" />
        You&apos;re subscribed — thanks!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col items-center gap-2">
      <p className="text-sm font-semibold text-foreground">Get new restaurants &amp; offers in your inbox</p>
      <div className="flex w-full items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-white px-3 py-2">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}

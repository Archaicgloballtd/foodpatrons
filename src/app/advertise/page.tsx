import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Megaphone, Eye, MousePointerClick, BadgeCheck } from "lucide-react";
import { AD_SLOTS } from "@/lib/adSlots";

export const metadata = {
  title: "Advertise with us — foodpatrons",
  description: "Promote your restaurant to real diners browsing foodpatrons across Bangladesh.",
};

export default function AdvertisePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Megaphone className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">For restaurants</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Advertise with us</h1>
        <p className="mt-2 text-muted-foreground">
          Put your restaurant in front of people actively looking for where to eat. Pick a placement, request it
          from your restaurant dashboard, and we&apos;ll confirm payment and activate it.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <Eye className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Real visibility</p>
            <p className="mt-1 text-xs text-muted-foreground">Placed across the pages diners actually use.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <MousePointerClick className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Tracked performance</p>
            <p className="mt-1 text-xs text-muted-foreground">See impressions and clicks on your ad, not just a promise.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">No long contracts</p>
            <p className="mt-1 text-xs text-muted-foreground">Request a slot, run it, request another when you want.</p>
          </div>
        </div>

        <h2 className="mt-10 text-lg font-bold text-foreground">Placements &amp; starting rates</h2>
        <p className="mt-1 text-sm text-muted-foreground">Priced per month, in BDT. Final pricing is confirmed with our team.</p>
        <div className="mt-4 flex flex-col gap-3">
          {AD_SLOTS.map((slot) => (
            <div key={slot.key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-bold text-foreground">{slot.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{slot.description}</p>
              </div>
              <p className="shrink-0 text-sm font-extrabold text-primary">৳{slot.price.toLocaleString()}/mo</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
          <p className="text-sm font-semibold text-foreground">Ready to get started?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your restaurant dashboard to request a placement, or claim your listing first if you haven&apos;t yet.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go to restaurant dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

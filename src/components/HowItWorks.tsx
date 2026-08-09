"use client";

import { motion } from "motion/react";
import { Search, CalendarCheck, UtensilsCrossed } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find",
    description: "Search or browse restaurants, offers, and cuisines near you.",
  },
  {
    icon: CalendarCheck,
    title: "Reserve or Claim",
    description: "Book a table or claim a live offer in a couple of taps.",
  },
  {
    icon: UtensilsCrossed,
    title: "Eat",
    description: "Show up, show your code, and enjoy — that's it.",
  },
];

const STEP_COLORS = [
  { bg: "bg-primary/12", text: "text-primary" },
  { bg: "bg-brand-purple/12", text: "text-brand-purple" },
  { bg: "bg-brand-turquoise/12", text: "text-brand-turquoise" },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-purple/[0.05] to-white px-4 py-14 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative hotlinked background, not an optimized content image */}
        <img
          src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1600&q=60"
          alt=""
          className="h-full w-full object-cover opacity-[0.1]"
        />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
      >
        How it works
      </motion.h2>
      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 32, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -6 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="flex flex-col items-center rounded-3xl border border-border bg-card p-7 text-center shadow-sm"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${STEP_COLORS[i].bg}`}>
              <step.icon className={`h-7 w-7 ${STEP_COLORS[i].text}`} />
            </div>
            <span className={`mt-3 text-xs font-bold uppercase tracking-wide ${STEP_COLORS[i].text}`}>
              Step {i + 1}
            </span>
            <h3 className="mt-1 text-xl font-bold text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

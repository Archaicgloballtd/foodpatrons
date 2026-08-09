"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Users,
  Compass,
  MapPin,
  UtensilsCrossed,
  CalendarClock,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Tag,
  Percent,
  Gift,
  MessagesSquare,
  Heart,
  Star,
} from "lucide-react";
import FeaturePanelGraphic from "./FeaturePanelGraphic";

type Panel = {
  bg: string;
  badgeIcon: typeof Users;
  badgeLabel: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  ctaText: string;
  imageFirst: boolean;
  graphic: ReactNode;
};

export default function MakeFoodFriends() {
  const panels: Panel[] = [
    {
      bg: "bg-primary",
      badgeIcon: Users,
      badgeLabel: "Make food friends",
      title: "Best plates. Best rates. Best mates.",
      description:
        "Compare deals, pick a spot everyone will love, and lock in a table in a couple of taps.",
      ctaHref: "/explore",
      ctaLabel: "Start exploring",
      ctaText: "text-primary",
      imageFirst: true,
      graphic: (
        <FeaturePanelGraphic
          mainIcon={Users}
          accentBg="bg-primary/12"
          accentText="text-primary"
          satellites={[
            { icon: MapPin, className: "-left-4 top-6", bg: "bg-secondary", text: "text-white" },
            { icon: Tag, className: "-right-3 top-2", bg: "bg-brand-turquoise", text: "text-white", delay: 0.4 },
            { icon: Star, className: "-bottom-3 left-10", bg: "bg-brand-sunny", text: "text-foreground", delay: 0.8 },
          ]}
        />
      ),
    },
    {
      bg: "bg-brand-purple",
      badgeIcon: CalendarCheck,
      badgeLabel: "Skip the wait",
      title: "Make reservations",
      description:
        "Search a restaurant, pick a time, and get a confirmation code in a couple of taps — no browsing detour required.",
      ctaHref: "/reserve",
      ctaLabel: "Reserve a table",
      ctaText: "text-brand-purple",
      imageFirst: false,
      graphic: (
        <FeaturePanelGraphic
          mainIcon={CalendarCheck}
          accentBg="bg-brand-purple/12"
          accentText="text-brand-purple"
          satellites={[
            { icon: Clock, className: "-left-3 top-4", bg: "bg-secondary", text: "text-white" },
            { icon: CheckCircle2, className: "-right-4 top-8", bg: "bg-brand-turquoise", text: "text-white", delay: 0.3 },
            { icon: Users, className: "-bottom-3 right-6", bg: "bg-primary", text: "text-primary-foreground", delay: 0.7 },
          ]}
        />
      ),
    },
    {
      bg: "bg-brand-turquoise",
      badgeIcon: Tag,
      badgeLabel: "Deals, daily",
      title: "Get the best offers & deals",
      description:
        "From discounts to buy-one-get-ones — browse live offers by how much you save and what kind of place you're after.",
      ctaHref: "/offers",
      ctaLabel: "See today's deals",
      ctaText: "text-brand-turquoise",
      imageFirst: true,
      graphic: (
        <FeaturePanelGraphic
          mainIcon={Tag}
          accentBg="bg-brand-turquoise/12"
          accentText="text-brand-turquoise"
          satellites={[
            { icon: Percent, className: "-left-4 top-2", bg: "bg-primary", text: "text-primary-foreground" },
            { icon: Gift, className: "-right-3 top-10", bg: "bg-brand-coral", text: "text-white", delay: 0.5 },
            { icon: Star, className: "-bottom-4 left-8", bg: "bg-brand-sunny", text: "text-foreground", delay: 0.9 },
          ]}
        />
      ),
    },
    {
      bg: "bg-secondary",
      badgeIcon: Compass,
      badgeLabel: "Always something nearby",
      title: "What's happening around you?",
      description:
        "Food festivals, pop-ups, and dining events around Dhaka — we'll show you what's closest first.",
      ctaHref: "/events?near=1",
      ctaLabel: "See what's on",
      ctaText: "text-secondary",
      imageFirst: false,
      graphic: (
        <FeaturePanelGraphic
          mainIcon={MapPin}
          accentBg="bg-secondary/12"
          accentText="text-secondary"
          satellites={[
            { icon: UtensilsCrossed, className: "-left-4 top-6", bg: "bg-primary", text: "text-primary-foreground" },
            { icon: CalendarClock, className: "-right-3 top-2", bg: "bg-brand-purple", text: "text-white", delay: 0.4 },
            { icon: Compass, className: "-bottom-3 left-10", bg: "bg-brand-turquoise", text: "text-white", delay: 0.8 },
          ]}
        />
      ),
    },
    {
      bg: "bg-brand-coral",
      badgeIcon: MessagesSquare,
      badgeLabel: "The conversation's live",
      title: "Discuss, review, and comment",
      description:
        "Join the community — post about your last meal, rate a spot, reply to someone else's find, all sorted by topic.",
      ctaHref: "/community",
      ctaLabel: "Join the conversation",
      ctaText: "text-brand-coral",
      imageFirst: true,
      graphic: (
        <FeaturePanelGraphic
          mainIcon={MessagesSquare}
          accentBg="bg-brand-coral/12"
          accentText="text-brand-coral"
          satellites={[
            { icon: Heart, className: "-left-3 top-6", bg: "bg-primary", text: "text-primary-foreground" },
            { icon: Star, className: "-right-4 top-2", bg: "bg-brand-sunny", text: "text-foreground", delay: 0.4 },
            { icon: Users, className: "-bottom-3 left-10", bg: "bg-secondary", text: "text-white", delay: 0.8 },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      {panels.map((panel) => (
        <section key={panel.title} className={`overflow-hidden ${panel.bg} px-4 py-14 sm:px-6 sm:py-20`}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: panel.imageFirst ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: panel.imageFirst ? 0 : 0.1 }}
              className={`text-center lg:text-left ${panel.imageFirst ? "order-2 lg:order-1" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30">
                <panel.badgeIcon className="h-3.5 w-3.5" />
                {panel.badgeLabel}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{panel.title}</h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/85 sm:text-lg lg:mx-0">{panel.description}</p>
              <Link
                href={panel.ctaHref}
                className={`mt-7 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold shadow-lg shadow-black/10 transition-transform hover:scale-105 active:scale-95 ${panel.ctaText}`}
              >
                {panel.ctaLabel}
              </Link>
            </motion.div>

            <div className={panel.imageFirst ? "order-1 lg:order-2" : ""}>{panel.graphic}</div>
          </div>
        </section>
      ))}
    </>
  );
}

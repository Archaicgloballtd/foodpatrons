"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { UtensilsCrossed, MapPin, Clock, ChefHat, type LucideIcon } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";

const STAT_COLORS = [
  { bg: "bg-primary/12", text: "text-primary" },
  { bg: "bg-brand-purple/12", text: "text-brand-purple" },
  { bg: "bg-brand-turquoise/12", text: "text-brand-turquoise" },
  { bg: "bg-brand-sunny/20", text: "text-amber-600" },
];

function CountUp({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  function start() {
    const duration = 1100;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  return (
    <motion.span onViewportEnter={start} viewport={{ once: true, margin: "-40px" }}>
      {value}
    </motion.span>
  );
}

function Stat({
  icon: Icon,
  value,
  suffix = "",
  label,
  color,
  delay,
}: {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  color: { bg: string; text: string };
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color.bg}`}>
        <Icon className={`h-5 w-5 ${color.text}`} />
      </div>
      <span className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        <CountUp target={value} />
        {suffix}
      </span>
      <span className="mt-1 text-sm font-medium text-muted-foreground">{label}</span>
    </motion.div>
  );
}

export default function StatsStrip({ restaurants }: { restaurants: Restaurant[] }) {
  const restaurantCount = restaurants.length;
  const areaCount = new Set(restaurants.map((r) => r.area).filter(Boolean)).size;
  const openNowCount = restaurants.filter((r) => r.is_open).length;
  const cuisineCount = new Set(restaurants.map((r) => r.cuisine).filter(Boolean)).size;

  if (restaurantCount === 0) return null;

  return (
    <section className="border-y border-border bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        <Stat
          icon={UtensilsCrossed}
          value={restaurantCount}
          suffix="+"
          label="Restaurants listed"
          color={STAT_COLORS[0]}
          delay={0}
        />
        <Stat
          icon={MapPin}
          value={areaCount}
          label="Neighborhoods covered"
          color={STAT_COLORS[1]}
          delay={0.1}
        />
        <Stat
          icon={Clock}
          value={openNowCount}
          label="Open right now"
          color={STAT_COLORS[2]}
          delay={0.2}
        />
        <Stat
          icon={ChefHat}
          value={cuisineCount}
          label="Cuisines to explore"
          color={STAT_COLORS[3]}
          delay={0.3}
        />
      </div>
    </section>
  );
}

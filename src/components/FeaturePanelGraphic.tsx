"use client";

import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

type Satellite = {
  icon: LucideIcon;
  className: string;
  bg: string;
  text: string;
  delay?: number;
};

export default function FeaturePanelGraphic({
  mainIcon: MainIcon,
  accentBg,
  accentText,
  satellites,
}: {
  mainIcon: LucideIcon;
  accentBg: string;
  accentText: string;
  satellites: Satellite[];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Soft depth blobs */}
      <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-6 -right-4 h-40 w-40 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />

      <div className="relative flex h-full w-full items-center justify-center rounded-[2.5rem] bg-white shadow-2xl shadow-black/20">
        <div className={`flex h-32 w-32 items-center justify-center rounded-full sm:h-40 sm:w-40 ${accentBg}`}>
          <MainIcon className={`h-14 w-14 sm:h-20 sm:w-20 ${accentText}`} />
        </div>

        {satellites.map(({ icon: Icon, className, bg, text, delay = 0 }, i) => (
          <motion.div
            key={i}
            className={`absolute flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-white sm:h-14 sm:w-14 ${bg} ${className}`}
            animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 4.5, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
            }
          >
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${text}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

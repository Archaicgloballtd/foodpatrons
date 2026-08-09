"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { categories } from "@/lib/categories";

export default function CategoryChips({ activeKey }: { activeKey?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map(({ key, label, icon: Icon }, i) => {
        const active = activeKey === key;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <Link
              href={`/explore?category=${key}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-primary"}`} />
              {label}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

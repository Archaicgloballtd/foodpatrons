"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAdsForSlot } from "@/lib/ads";
import type { Ad } from "@/lib/adSlots";

const SEEN_KEY = "fp_popup_seen";

export default function PopupAd() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    getAdsForSlot("home_popup").then((ads) => {
      if (cancelled || ads.length === 0) return;
      setAd(ads[0]);
      timer = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, 1500);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  function handleClose() {
    setVisible(false);
    sessionStorage.setItem(SEEN_KEY, "1");
  }

  return (
    <AnimatePresence>
      {ad && visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow"
            >
              <X className="h-4 w-4" />
            </button>
            {ad.image_url && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
              <img src={ad.image_url} alt={ad.title} className="h-48 w-full object-cover" />
            )}
            <div className="p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sponsored
              </span>
              <h3 className="mt-1 text-lg font-bold text-foreground">{ad.title}</h3>
              {ad.description && (
                <p className="mt-1 text-sm text-muted-foreground">{ad.description}</p>
              )}
              {ad.link_url && (
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={handleClose}
                  className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Learn more
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

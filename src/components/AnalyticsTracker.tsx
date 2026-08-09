"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "fp_session_id";
const HEARTBEAT_MS = 20000;

function getSessionId(): string {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function currentUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

function send(path: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(path, new Blob([body], { type: "application/json" }));
  } else {
    fetch(path, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
      () => {},
    );
  }
}

/**
 * Silent, backend-only visit tracking — no UI. Records page views and time
 * on site per anonymous (localStorage) session, linked to the signed-in user
 * when available. See supabase/analytics.sql and /privacy for what's
 * collected and why.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = await currentUserId();
      if (cancelled) return;
      send("/api/track", {
        sessionId: getSessionId(),
        userId,
        eventType: "page_view",
        path: pathname,
        referrer: document.referrer || undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let lastTick = Date.now();

    async function beat() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      const deltaSeconds = Math.round((now - lastTick) / 1000);
      lastTick = now;
      const userId = await currentUserId();
      send("/api/track", { sessionId: getSessionId(), userId, eventType: "heartbeat", deltaSeconds });
    }

    const interval = setInterval(beat, HEARTBEAT_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        lastTick = Date.now();
      } else {
        beat();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", beat);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", beat);
    };
  }, []);

  return null;
}

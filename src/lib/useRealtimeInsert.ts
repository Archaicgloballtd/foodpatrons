"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/** Fires `onInsert` whenever a new row matching `filter` is inserted into `table`. */
export function useRealtimeInsert<T>(table: string, filter: string, onInsert: (row: T) => void) {
  const callbackRef = useRef(onInsert);
  useEffect(() => {
    callbackRef.current = onInsert;
  });

  useEffect(() => {
    const channel = supabase
      .channel(`${table}:${filter}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table, filter },
        (payload) => callbackRef.current(payload.new as T),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}

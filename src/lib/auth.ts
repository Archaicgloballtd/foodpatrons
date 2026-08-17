"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "staff" | "admin";
  points: number;
  referral_code: string | null;
};

function isMissingColumn(message: string, column: string): boolean {
  return message.includes(column) && message.includes("does not exist");
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data: initialData, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, points, referral_code")
        .eq("id", currentUser.id)
        .maybeSingle();
      let data: Profile | null = initialData;

      if (error && (isMissingColumn(error.message, "points") || isMissingColumn(error.message, "referral_code"))) {
        const retry = await supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", currentUser.id)
          .maybeSingle();
        data = retry.data ? { ...retry.data, points: 0, referral_code: null } : null;
      }

      if (active) {
        setProfile(data);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      if (active) setUser(currentUser);
      loadProfile(currentUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(true);
      loadProfile(currentUser);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, fullName: string, metadata?: Record<string, string>) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      // Stored on auth.users immediately, before email confirmation — used to
      // carry a restaurant application's details through to first sign-in,
      // since there's no authenticated session yet to write them to the
      // database directly (RLS requires auth.uid(), which doesn't exist
      // until the account is confirmed).
      data: { full_name: fullName, ...metadata },
      // Without this, Supabase falls back to the project's dashboard-configured
      // Site URL for the confirmation link — which is easy to leave pointed at
      // localhost after deploying, causing "page fails to load" on click.
      emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

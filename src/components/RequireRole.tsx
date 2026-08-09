"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth";

export default function RequireRole({
  role,
  children,
}: {
  role: "staff" | "admin";
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useSession();

  if (loading) {
    return <p className="p-8 text-center text-sm text-zinc-500">Loading…</p>;
  }

  const allowed = profile?.role === role || profile?.role === "admin";

  if (!user || !allowed) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-zinc-500">
          {user
            ? "You don't have access to this page."
            : "Please sign in to continue."}
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

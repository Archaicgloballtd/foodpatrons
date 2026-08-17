"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, User as UserIcon, Clock, CheckCircle2, XCircle, Search, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { signIn, signUp, useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type AccountType = "customer" | "restaurant";
type ApplicationStatus = "pending" | "approved" | "rejected";
type Application = { status: ApplicationStatus; restaurant_name: string; admin_note: string | null };
type ClaimMode = "existing" | "new";
type RestaurantOption = { id: string; name: string; area: string | null; cuisine: string | null };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref");
  const { user, profile, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">(referredByCode ? "signup" : "signin");
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  // Claiming an existing listing (the common case now that most real
  // restaurants are already on the site) vs. filing for a brand-new one.
  const [claimMode, setClaimMode] = useState<ClaimMode>("existing");
  const [restaurantOptions, setRestaurantOptions] = useState<RestaurantOption[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantOption | null>(null);

  // A user who signed up as "restaurant" carries that intent in their auth
  // metadata (set at signup, before email confirmation existed as a session).
  // The first time they show up here with a real session, file the
  // application for them if one doesn't exist yet.
  useEffect(() => {
    async function syncApplication() {
      if (loading || !user) {
        setCheckingApplication(false);
        return;
      }

      const { data: existing } = await supabase
        .from("restaurant_applications")
        .select("status, restaurant_name, admin_note")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setApplication(existing as Application);
        setCheckingApplication(false);
        return;
      }

      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta?.account_type === "restaurant" && meta.restaurant_name) {
        const { data: created } = await supabase
          .from("restaurant_applications")
          .insert({
            user_id: user.id,
            restaurant_name: meta.restaurant_name,
            restaurant_id: meta.restaurant_id || null,
            contact_phone: meta.contact_phone || null,
            message: meta.message || null,
          })
          .select("status, restaurant_name, admin_note")
          .single();
        setApplication((created as Application) ?? null);
      }
      setCheckingApplication(false);
    }

    syncApplication();
  }, [loading, user]);

  // Only fetch the restaurant list once someone actually opens the "claim an
  // existing listing" picker — no reason to pull ~300 rows for every visitor
  // who lands on this page.
  useEffect(() => {
    if (mode !== "signup" || accountType !== "restaurant" || claimMode !== "existing" || restaurantsLoaded) return;
    async function loadRestaurants() {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, area, cuisine")
        .order("name");
      setRestaurantOptions((data as RestaurantOption[]) ?? []);
      setRestaurantsLoaded(true);
    }
    loadRestaurants();
  }, [mode, accountType, claimMode, restaurantsLoaded]);

  const filteredRestaurantOptions = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    const list = !q
      ? restaurantOptions
      : restaurantOptions.filter((r) =>
          [r.name, r.area, r.cuisine].some((field) => field?.toLowerCase().includes(q)),
        );
    return list.slice(0, 8);
  }, [restaurantOptions, restaurantQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "signin") {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      return;
    }

    if (accountType === "restaurant" && claimMode === "existing" && !selectedRestaurant) {
      setSubmitting(false);
      setError("Search for and select your restaurant, or switch to “It's not listed yet.”");
      return;
    }

    const metadata: Record<string, string> =
      accountType === "restaurant"
        ? {
            account_type: "restaurant",
            restaurant_name: claimMode === "existing" ? (selectedRestaurant?.name ?? "") : restaurantName,
            restaurant_id: claimMode === "existing" ? (selectedRestaurant?.id ?? "") : "",
            contact_phone: contactPhone,
            message,
          }
        : { account_type: "customer", restaurant_name: "", restaurant_id: "", contact_phone: "", message: "" };
    if (referredByCode) metadata.referred_by_code = referredByCode;
    const { error } = await signUp(email, password, fullName, metadata);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setError(
      accountType === "restaurant"
        ? "Account created. Check your email to confirm — once confirmed and signed in, your restaurant application will be submitted for review."
        : "Account created. Check your email if confirmation is required, then sign in.",
    );
    setMode("signin");
  }

  if (!loading && user) {
    return (
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">Signed in as</p>
          <p className="text-lg font-semibold">{user.email}</p>
          <p className="mt-1 text-sm text-zinc-500">Role: {profile?.role ?? "…"}</p>

          {!checkingApplication && application && (
            <div className="mt-5 flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
              {application.status === "pending" && (
                <>
                  <Clock className="h-5 w-5 text-amber-500" />
                  <p className="text-sm font-semibold text-foreground">
                    Restaurant application pending
                  </p>
                  <p className="text-xs text-muted-foreground">
                    &quot;{application.restaurant_name}&quot; is awaiting admin review. We&apos;ll approve it once
                    verified — no action needed from you.
                  </p>
                </>
              )}
              {application.status === "approved" && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <p className="text-sm font-semibold text-foreground">Restaurant application approved</p>
                  <p className="text-xs text-muted-foreground">
                    You now have restaurant dashboard access for &quot;{application.restaurant_name}&quot;.
                  </p>
                </>
              )}
              {application.status === "rejected" && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-semibold text-foreground">Restaurant application not approved</p>
                  <p className="text-xs text-muted-foreground">
                    {application.admin_note || "Contact support if you think this was a mistake."}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {profile?.role === "admin" && (
              <a href="/admin" className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
                Go to admin dashboard
              </a>
            )}
            {(profile?.role === "staff" || profile?.role === "admin") && (
              <a href="/dashboard" className="rounded-full border border-orange-600 px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50">
                Go to restaurant dashboard
              </a>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "signin"
            ? "For customers, restaurant owners, and staff."
            : "Customers don't need an account to browse or reserve — sign up here if you run a restaurant, or want one anyway."}
        </p>
        {mode === "signup" && referredByCode && (
          <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">You were invited by a friend — thanks for joining!</p>
        )}

        {mode === "signup" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAccountType("customer")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                accountType === "customer"
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-black/10 text-zinc-600 hover:bg-zinc-50 dark:border-white/10"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setAccountType("restaurant")}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                accountType === "restaurant"
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-black/10 text-zinc-600 hover:bg-zinc-50 dark:border-white/10"
              }`}
            >
              <Store className="h-4 w-4" />
              Restaurant owner
            </button>
          </div>
        )}

        {mode === "signup" && accountType === "restaurant" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Restaurant accounts need admin approval before you get access to a restaurant
            dashboard. You&apos;ll be notified here once reviewed.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm">
              Full name
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
              />
            </label>
          )}
          {mode === "signup" && accountType === "restaurant" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClaimMode("existing");
                    setError("");
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    claimMode === "existing"
                      ? "border-orange-600 bg-orange-50 text-orange-700"
                      : "border-black/10 text-zinc-600 hover:bg-zinc-50 dark:border-white/10"
                  }`}
                >
                  Claim my restaurant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClaimMode("new");
                    setError("");
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    claimMode === "new"
                      ? "border-orange-600 bg-orange-50 text-orange-700"
                      : "border-black/10 text-zinc-600 hover:bg-zinc-50 dark:border-white/10"
                  }`}
                >
                  It&apos;s not listed yet
                </button>
              </div>

              {claimMode === "existing" ? (
                <div className="flex flex-col gap-1 text-sm">
                  Your restaurant
                  {selectedRestaurant ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
                      <span className="flex items-center gap-1.5 truncate">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{selectedRestaurant.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRestaurant(null);
                          setRestaurantQuery("");
                        }}
                        className="shrink-0 text-xs font-semibold underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10">
                        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <input
                          type="text"
                          value={restaurantQuery}
                          onChange={(e) => setRestaurantQuery(e.target.value)}
                          placeholder="Search by name or area"
                          className="w-full bg-transparent text-sm outline-none dark:bg-zinc-900"
                        />
                      </div>
                      {restaurantQuery.trim() && (
                        <div className="mt-1 flex max-h-48 flex-col gap-0.5 overflow-y-auto rounded-lg border border-black/10 dark:border-white/10">
                          {!restaurantsLoaded ? (
                            <p className="px-3 py-2 text-xs text-zinc-500">Loading restaurants…</p>
                          ) : filteredRestaurantOptions.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-zinc-500">
                              No match. Try a different search, or switch to &quot;It&apos;s not listed yet.&quot;
                            </p>
                          ) : (
                            filteredRestaurantOptions.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRestaurant(r);
                                  setRestaurantQuery("");
                                }}
                                className="flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-zinc-800"
                              >
                                <span className="font-medium">{r.name}</span>
                                <span className="text-xs text-zinc-500">
                                  {[r.cuisine, r.area].filter(Boolean).join(" · ")}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <label className="flex flex-col gap-1 text-sm">
                  Restaurant name
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1 text-sm">
                Contact phone
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Anything else we should know? (optional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
                />
              </label>
            </>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:bg-zinc-900"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : accountType === "restaurant"
                  ? "Submit application"
                  : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="mt-4 text-sm text-orange-600 hover:underline"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </main>
      <Footer />
    </div>
  );
}

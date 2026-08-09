"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Search, ShieldCheck, Heart, Store, Menu, X } from "lucide-react";
import Logo from "./Logo";
import NavProfileMenu from "./NavProfileMenu";
import NotificationBell from "./NotificationBell";
import { useSession } from "@/lib/auth";
import { nearestDistrict } from "@/lib/areas";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/offers", label: "Offers" },
  { href: "/events", label: "Events" },
  { href: "/community", label: "Community" },
  { href: "/saved", label: "Saved" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Bangladesh");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLabel(nearestDistrict({ lat: position.coords.latitude, lng: position.coords.longitude }));
      },
      () => {},
      { timeout: 10000 },
    );
  }, []);

  function isActive(href: string) {
    return pathname === href.split("?")[0];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <div className="hidden items-center gap-6 text-sm font-semibold text-foreground/70 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`relative py-1 transition-colors hover:text-primary ${
                isActive(link.href) ? "text-primary" : ""
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-accent/30 sm:flex"
          >
            <MapPin className="h-4 w-4 text-primary" />
            {locationLabel}
          </Link>
          <Link
            href="/explore"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/80 hover:bg-accent/30"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            href="/saved"
            aria-label="Saved"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/80 hover:bg-accent/30 md:hidden"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="hidden items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted lg:flex"
          >
            <Store className="h-4 w-4 text-primary" />
            List your business
          </Link>
          <Link
            href="/admin"
            aria-label="Admin"
            title="Admin"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground/40 hover:bg-muted hover:text-foreground/70 sm:flex"
          >
            <ShieldCheck className="h-4 w-4" />
          </Link>
          {!loading && user ? (
            <>
              <NotificationBell />
              <NavProfileMenu />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-muted md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive(link.href) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted"
            >
              <Store className="h-4 w-4 text-primary" />
              List your business
            </Link>
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

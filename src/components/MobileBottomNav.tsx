"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Compass, Tag, MessagesSquare, CalendarCheck, User } from "lucide-react";

const items = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/offers", label: "Offers", icon: Tag },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/profile", label: "Profile", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-white/95 py-2 backdrop-blur sm:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href.split("?")[0];
        return (
          <Link
            key={label}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute -top-2 h-1 w-6 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "./Logo";
import { BurgerIcon, PizzaIcon, DrinkIcon, DonutIcon, NoodleBowlIcon } from "./FoodIcons";
import NewsletterSignup from "./NewsletterSignup";

export default function Footer({ adSlot }: { adSlot?: ReactNode }) {
  return (
    <footer className="border-t border-border bg-white px-6 py-10 text-center text-sm text-muted-foreground">
      {adSlot && <div className="mx-auto mb-6 max-w-md">{adSlot}</div>}
      <div className="mb-8">
        <NewsletterSignup />
      </div>
      <div className="mb-4 flex items-center justify-center gap-3 opacity-70" aria-hidden="true">
        <BurgerIcon size={22} />
        <PizzaIcon size={22} />
        <DrinkIcon size={22} />
        <DonutIcon size={22} />
        <NoodleBowlIcon size={22} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <LogoMark size={32} />
        <p className="font-semibold text-foreground">foodpatrons</p>
        <p className="text-primary">make food friends</p>
      </div>
      <p className="mt-4">© {new Date().getFullYear()} foodpatrons. All rights reserved.</p>
      <div className="mt-1 flex items-center justify-center gap-3 text-xs">
        <Link href="/guides" className="text-muted-foreground underline hover:text-foreground">
          Guides
        </Link>
        <Link href="/advertise" className="text-muted-foreground underline hover:text-foreground">
          Advertise with us
        </Link>
        <Link href="/privacy" className="text-muted-foreground underline hover:text-foreground">
          Privacy policy
        </Link>
        <Link href="/terms" className="text-muted-foreground underline hover:text-foreground">
          Terms of service
        </Link>
      </div>
    </footer>
  );
}

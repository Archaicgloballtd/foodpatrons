import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Mascot from "@/components/Mascot";

export const metadata = {
  title: "Page not found — foodpatrons",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Mascot pose="sad" size={130} />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We looked everywhere on the menu, but this page isn&apos;t on it.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Back to foodpatrons
        </Link>
      </main>
      <Footer />
    </div>
  );
}

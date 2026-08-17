import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — foodpatrons",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-sm leading-relaxed text-foreground/80 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated {new Date().toLocaleDateString()}.</p>

        <h2 className="mt-6 text-lg font-bold text-foreground">What foodpatrons is</h2>
        <p className="mt-2">
          foodpatrons is a discovery platform that lists restaurants and cafes across Bangladesh, and lets you make
          reservations and claim offers directly with those businesses. We are not the restaurant — each listing is
          run by its own owner or staff, and they are responsible for honoring reservations, offers, food quality,
          and safety.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Reservations and offers</h2>
        <p className="mt-2">
          A reservation made through foodpatrons is a request sent to the restaurant; it is not a guarantee of a
          table until the restaurant confirms it. Offers and discounts are set by each restaurant and can change or
          end at any time. We are not liable for a restaurant declining, changing, or being unable to honor a
          reservation or offer.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Listing accuracy</h2>
        <p className="mt-2">
          We work to keep listing details (hours, menu, price range, contact info) accurate and sourced from public,
          verifiable information, but details can change without notice. Always confirm time-sensitive details
          directly with the restaurant for anything important.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Restaurant accounts</h2>
        <p className="mt-2">
          If you claim or manage a listing as restaurant staff, you&apos;re responsible for keeping the information
          you submit accurate and for any offers, menu items, or replies you post under that account. We may
          suspend a listing&apos;s staff access if we find fraudulent claims or misuse.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Advertising</h2>
        <p className="mt-2">
          Restaurants may pay to promote a listing in designated ad placements. Buying an ad does not change how a
          listing&apos;s reviews, ratings, or search ranking work. Ad placement is subject to availability and our
          approval.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Community content</h2>
        <p className="mt-2">
          Reviews, posts, and comments must be your own honest experience. Don&apos;t post anything defamatory,
          fraudulent, or that impersonates someone else. We can remove content that violates this or that we&apos;re
          required to remove by law.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Limitation of liability</h2>
        <p className="mt-2">
          foodpatrons is provided as-is. To the fullest extent permitted by law, we are not liable for losses
          arising from a restaurant&apos;s food, service, or conduct, from a missed or incorrect reservation, or
          from reliance on listing information we did not independently verify beyond what&apos;s stated above.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Changes</h2>
        <p className="mt-2">
          We may update these terms as the platform grows. Continued use of foodpatrons after a change means you
          accept the updated terms.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Contact</h2>
        <p className="mt-2">
          Questions about these terms? Reach us at{" "}
          <a href="mailto:info@foodpatrons.com" className="text-primary underline">
            info@foodpatrons.com
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}

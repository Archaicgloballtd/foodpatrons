import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy — foodpatrons",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-sm leading-relaxed text-foreground/80 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Privacy policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated {new Date().toLocaleDateString()}.</p>

        <h2 className="mt-6 text-lg font-bold text-foreground">What we collect automatically</h2>
        <p className="mt-2">
          When you use foodpatrons, we automatically record basic visit data in the background: which pages you
          view, when you access the site, how long you spend on it per visit, and general referral information
          (e.g. the site that linked you here). This is tied to a random identifier stored in your browser, and to
          your account if you&apos;re signed in.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">What we collect when you use features</h2>
        <p className="mt-2">
          Reservations, offer claims, reviews, and community posts store what you submit (name, phone where
          required, message content). Restaurant staff and admin accounts additionally store profile details you
          provide.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">How this data is used</h2>
        <p className="mt-2">
          We use visit data to understand how the site is used and to report aggregate and usage statistics to
          advertising partners (for example, how many people saw or interacted with a listing). We do not sell
          your name, phone number, or account email to advertisers.
        </p>

        <h2 className="mt-6 text-lg font-bold text-foreground">Your choices</h2>
        <p className="mt-2">
          You can browse, reserve, and claim offers without creating an account. Community posts, comments, and
          your profile are visible to other users. You can delete your own posts and comments at any time. Contact
          us if you&apos;d like your account data removed.
        </p>
      </main>
      <Footer />
    </div>
  );
}

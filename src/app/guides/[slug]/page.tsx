import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantCard from "@/components/RestaurantCard";
import { getPostBySlug } from "@/lib/blog";
import { getRestaurantsByIds } from "@/lib/restaurants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { post } = await getPostBySlug(slug);
  if (!post) return { title: "Guide — foodpatrons" };
  return {
    title: `${post.title} — foodpatrons`,
    description: post.excerpt ?? undefined,
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { post, error } = await getPostBySlug(slug);

  if (!post && !error) notFound();

  const { restaurants } = post ? await getRestaurantsByIds(post.restaurant_ids) : { restaurants: [] };

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {error && !post && <p className="text-sm text-destructive">Couldn&apos;t load this guide: {error}</p>}
        {post && (
          <>
            {(post.city || post.category) && (
              <span className="inline-block rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-semibold text-brand-purple">
                {[post.category, post.city].filter(Boolean).join(" · ")}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">{post.title}</h1>

            <div className="prose-guide mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground/85">
              {post.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {restaurants.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-foreground">Restaurants in this guide</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {restaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/explore"
              className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Explore more restaurants
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

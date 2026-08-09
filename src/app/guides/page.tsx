import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { BookOpen, ArrowRight } from "lucide-react";
import { getPublishedPosts } from "@/lib/blog";

export const metadata = {
  title: "Food guides — foodpatrons",
  description: "Area and cuisine guides to real restaurants and cafes across Bangladesh.",
};

export default async function GuidesPage() {
  const { posts, error } = await getPublishedPosts();

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Food guides</h1>
        <p className="mt-1 text-muted-foreground">
          Area and cuisine guides built from real restaurants already on foodpatrons.
        </p>

        {error && <p className="mt-6 text-sm text-destructive">Couldn&apos;t load guides: {error}</p>}
        {!error && posts.length === 0 && (
          <div className="mt-8">
            <EmptyState icon={BookOpen} title="No guides yet" description="Check back soon for area and cuisine guides." />
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/guides/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div>
                  {(post.city || post.category) && (
                    <span className="inline-block rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-semibold text-brand-purple">
                      {[post.category, post.city].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <h2 className="mt-2 text-lg font-bold text-foreground">{post.title}</h2>
                  {post.excerpt && <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>}
                </div>
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
                  Read guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Trash2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  social_caption: string | null;
  city: string | null;
  category: string | null;
  is_published: boolean;
  created_at: string;
};

export default function AdminContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, social_caption, city, category, is_published, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setPosts(data ?? []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  async function togglePublish(post: Post) {
    setBusyId(post.id);
    const nextPublished = !post.is_published;
    await supabase
      .from("blog_posts")
      .update({ is_published: nextPublished, published_at: nextPublished ? new Date().toISOString() : null })
      .eq("id", post.id);
    setBusyId(null);
    load();
  }

  async function remove(id: string) {
    setBusyId(id);
    await supabase.from("blog_posts").delete().eq("id", id);
    setBusyId(null);
    load();
  }

  async function copyCaption(post: Post) {
    if (!post.social_caption) return;
    await navigator.clipboard.writeText(post.social_caption);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading guides…</p>;
  if (error) return <p className="text-sm text-destructive">Couldn&apos;t load guides: {error}</p>;
  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No guides yet. The content agent generates draft guides automatically — check back after its next run, or
        trigger a generation pass manually.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <div key={post.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{post.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    post.is_published ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {post.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[post.category, post.city].filter(Boolean).join(" · ") || "Uncategorized"} ·{" "}
                {new Date(post.created_at).toLocaleDateString()}
              </p>
              {post.excerpt && <p className="mt-2 text-sm text-foreground/80">{post.excerpt}</p>}
              {post.is_published && (
                <Link href={`/guides/${post.slug}`} target="_blank" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  View live →
                </Link>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={() => togglePublish(post)}
                disabled={busyId === post.id}
                className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
              >
                {post.is_published ? "Unpublish" : "Publish"}
              </button>
              {post.social_caption && (
                <button
                  type="button"
                  onClick={() => copyCaption(post)}
                  className="flex items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  {copiedId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedId === post.id ? "Copied" : "Copy caption"}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(post.id)}
                disabled={busyId === post.id}
                className="flex items-center justify-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

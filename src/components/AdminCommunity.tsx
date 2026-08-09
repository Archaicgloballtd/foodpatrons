"use client";

import { useEffect, useState } from "react";
import { Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  topics: { name: string } | null;
};

export default function AdminCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("id, content, created_at, profiles(full_name), topics(name)")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Post[]>();
    setPosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout admin components
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remove this post? This also removes its comments and likes.")) return;
    await supabase.from("posts").delete().eq("id", id);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading posts…</p>;
  if (posts.length === 0) return <p className="text-sm text-muted-foreground">No posts yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <div key={post.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{post.profiles?.full_name || "foodpatrons user"}</span>
              <span>·</span>
              <span>{post.topics?.name ?? "General"}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90">{post.content}</p>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(post.id)}
            aria-label="Delete post"
            className="shrink-0 rounded-full p-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

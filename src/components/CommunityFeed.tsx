"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Send, MessagesSquare, MapPin, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import type { Topic, Post } from "@/lib/community";
import PostCard from "./PostCard";
import EmptyState from "./EmptyState";
import CommunityMeetups from "./CommunityMeetups";

const POST_SELECT =
  "id, author_id, topic_id, content, created_at, like_count, comment_count, restaurant_id, profiles(full_name, is_official), topics(slug, name), restaurants(id, name, area, cover_image_url, image_url)";

type RestaurantOption = { id: string; name: string; area: string | null; cuisine: string | null };

export default function CommunityFeed({ topics }: { topics: Topic[] }) {
  const { user, profile } = useSession();
  // Community is intentionally not split into a big row of topic tabs —
  // everything (general chat, meetups) shows together on one page instead
  // of requiring a click to find. The topic field still exists for the
  // composer to tag a post with (shown as a badge on the card), it just
  // isn't used to filter the feed you see.
  const activeTopic = "all";
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [composerContent, setComposerContent] = useState("");
  const [composerTopicId, setComposerTopicId] = useState(topics[0]?.id ?? "");
  const [posting, setPosting] = useState(false);
  const [restaurantPickerOpen, setRestaurantPickerOpen] = useState(false);
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantOptions, setRestaurantOptions] = useState<RestaurantOption[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [taggedRestaurant, setTaggedRestaurant] = useState<RestaurantOption | null>(null);

  useEffect(() => {
    if (!restaurantPickerOpen || restaurantsLoaded) return;
    supabase
      .from("restaurants")
      .select("id, name, area, cuisine")
      .order("name")
      .then(({ data }) => {
        setRestaurantOptions((data as RestaurantOption[]) ?? []);
        setRestaurantsLoaded(true);
      });
  }, [restaurantPickerOpen, restaurantsLoaded]);

  const filteredRestaurantOptions = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    const list = !q ? restaurantOptions : restaurantOptions.filter((r) => [r.name, r.area, r.cuisine].some((f) => f?.toLowerCase().includes(q)));
    return list.slice(0, 8);
  }, [restaurantOptions, restaurantQuery]);

  async function loadPosts(topicSlug: string) {
    setLoading(true);
    let query = supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(50);
    if (topicSlug !== "all") {
      const topic = topics.find((t) => t.slug === topicSlug);
      if (topic) query = query.eq("topic_id", topic.id);
    }
    const { data } = await query.returns<Post[]>();
    const loaded = data ?? [];
    setPosts(loaded);

    if (user && loaded.length > 0) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in(
          "post_id",
          loaded.map((p) => p.id),
        );
      setLikedIds(new Set((likes ?? []).map((l) => l.post_id)));
    } else {
      setLikedIds(new Set());
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on topic/session change
    loadPosts(activeTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic, user?.id]);

  useEffect(() => {
    const channel = supabase
      .channel("posts:live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        const newId = (payload.new as { id: string }).id;
        const { data } = await supabase.from("posts").select(POST_SELECT).eq("id", newId).returns<Post[]>().single();
        if (!data) return;
        const matchesTopic = activeTopic === "all" || data.topics?.slug === activeTopic;
        if (!matchesTopic) return;
        setPosts((prev) => (prev.some((p) => p.id === data.id) ? prev : [data, ...prev]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTopic]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !composerContent.trim() || !composerTopicId || posting) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        topic_id: composerTopicId,
        content: composerContent.trim(),
        restaurant_id: taggedRestaurant?.id ?? null,
      })
      .select(POST_SELECT)
      .returns<Post[]>()
      .single();
    setPosting(false);
    if (!error && data) {
      const matchesTopic = activeTopic === "all" || data.topics?.slug === activeTopic;
      if (matchesTopic) setPosts((prev) => [data, ...prev]);
      setComposerContent("");
      setTaggedRestaurant(null);
      setRestaurantPickerOpen(false);
      setRestaurantQuery("");
    }
  }

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2">
        <MessagesSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Community</h1>
      </div>

      <CommunityMeetups />

      <h2 className="text-sm font-bold text-foreground">General</h2>

      {user ? (
        <form onSubmit={handlePost} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3">
          <textarea
            value={composerContent}
            onChange={(e) => setComposerContent(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="What's happening in Dhaka's food scene?"
            className="w-full resize-none rounded-lg bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />

          {taggedRestaurant ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
              <span className="flex min-w-0 items-center gap-1 truncate font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{taggedRestaurant.name}</span>
              </span>
              <button type="button" onClick={() => setTaggedRestaurant(null)} className="shrink-0 text-primary/70 hover:text-primary">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : restaurantPickerOpen ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={restaurantQuery}
                  onChange={(e) => setRestaurantQuery(e.target.value)}
                  placeholder="Tag a restaurant (optional)"
                  className="w-full bg-transparent text-xs outline-none"
                />
                <button type="button" onClick={() => setRestaurantPickerOpen(false)} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {restaurantQuery.trim() && (
                <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border">
                  {!restaurantsLoaded ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
                  ) : filteredRestaurantOptions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No match.</p>
                  ) : (
                    filteredRestaurantOptions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setTaggedRestaurant(r);
                          setRestaurantPickerOpen(false);
                          setRestaurantQuery("");
                        }}
                        className="flex flex-col items-start px-3 py-1.5 text-left text-xs hover:bg-muted"
                      >
                        <span className="font-medium">{r.name}</span>
                        <span className="text-[11px] text-muted-foreground">{[r.cuisine, r.area].filter(Boolean).join(" · ")}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRestaurantPickerOpen(true)}
              className="flex w-fit items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              <MapPin className="h-3.5 w-3.5" />
              Tag a restaurant
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <select
              value={composerTopicId}
              onChange={(e) => setComposerTopicId(e.target.value)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={posting || !composerContent.trim()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/60 p-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to post, like, and comment.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : posts.length === 0 ? (
        <EmptyState mascot="search" title="No posts yet" description="Be the first to start the conversation." />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isAdmin={profile?.role === "admin"}
              liked={likedIds.has(post.id)}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

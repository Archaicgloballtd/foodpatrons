"use client";

import { useState } from "react";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Post, Comment } from "@/lib/community";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function initialsFor(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function PostCard({
  post,
  currentUserId,
  isAdmin,
  liked,
  onDeleted,
}: {
  post: Post;
  currentUserId: string | undefined;
  isAdmin: boolean;
  liked: boolean;
  onDeleted: (id: string) => void;
}) {
  const [likeState, setLikeState] = useState({ liked, count: post.like_count });
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);

  async function toggleLike() {
    if (!currentUserId || likeBusy) return;
    setLikeBusy(true);
    if (likeState.liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      setLikeState((s) => ({ liked: false, count: Math.max(0, s.count - 1) }));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      setLikeState((s) => ({ liked: true, count: s.count + 1 }));
    }
    setLikeBusy(false);
  }

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, post_id, author_id, content, created_at, profiles(full_name)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .returns<Comment[]>();
    setComments(data ?? []);
    setCommentsLoaded(true);
  }

  async function handleToggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !commentsLoaded) await loadComments();
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !commentText.trim() || posting) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: currentUserId, content: commentText.trim() })
      .select("id, post_id, author_id, content, created_at, profiles(full_name)")
      .returns<Comment[]>()
      .single();
    setPosting(false);
    if (!error && data) {
      setComments((c) => [...c, data]);
      setCommentText("");
      setCommentCount((n) => n + 1);
    }
  }

  async function handleDeleteComment(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    setComments((c) => c.filter((cm) => cm.id !== id));
    setCommentCount((n) => Math.max(0, n - 1));
  }

  async function handleDeletePost() {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onDeleted(post.id);
  }

  const canDeletePost = isAdmin || post.author_id === currentUserId;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
          {initialsFor(post.profiles?.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">{post.profiles?.full_name || "foodpatrons user"}</span>
            <span className="text-muted-foreground">· {timeAgo(post.created_at)}</span>
            {post.topics && (
              <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {post.topics.name}
              </span>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{post.content}</p>

          <div className="mt-3 flex items-center gap-4 text-muted-foreground">
            <button
              type="button"
              onClick={toggleLike}
              disabled={!currentUserId}
              aria-label={likeState.liked ? "Unlike" : "Like"}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart className={`h-4 w-4 ${likeState.liked ? "fill-primary text-primary" : ""}`} />
              {likeState.count > 0 && likeState.count}
            </button>
            <button
              type="button"
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              {commentCount > 0 && commentCount}
            </button>
            {canDeletePost && (
              <button
                type="button"
                onClick={handleDeletePost}
                aria-label="Delete post"
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-destructive/70 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {commentsOpen && (
            <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                  <p>
                    <span className="font-semibold text-foreground">{c.profiles?.full_name || "foodpatrons user"}</span>{" "}
                    <span className="text-foreground/80">{c.content}</span>{" "}
                    <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </p>
                  {(isAdmin || c.author_id === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      aria-label="Delete comment"
                      className="shrink-0 text-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {commentsLoaded && comments.length === 0 && (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              )}
              {currentUserId ? (
                <form onSubmit={handlePostComment} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    className="w-full flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim()}
                    aria-label="Post comment"
                    className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <p className="text-xs text-muted-foreground">Sign in to comment.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

import { supabase } from "@/lib/supabase";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  city: string | null;
  category: string | null;
  restaurant_ids: string[];
  published_at: string | null;
};

const FIELDS = "id, slug, title, excerpt, content, city, category, restaurant_ids, published_at";

export async function getPublishedPosts(): Promise<{ posts: BlogPost[]; error: string | null }> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(FIELDS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) return { posts: [], error: error.message };
  return { posts: data ?? [], error: null };
}

export async function getPostBySlug(slug: string): Promise<{ post: BlogPost | null; error: string | null }> {
  const { data, error } = await supabase.from("blog_posts").select(FIELDS).eq("slug", slug).eq("is_published", true).maybeSingle();

  if (error) return { post: null, error: error.message };
  return { post: data, error: null };
}

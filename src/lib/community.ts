import { supabase } from "@/lib/supabase";

export type Topic = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type Post = {
  id: string;
  author_id: string;
  topic_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null; is_official: boolean } | null;
  topics: { slug: string; name: string } | null;
  like_count: number;
  comment_count: number;
  restaurant_id: string | null;
  restaurants: { id: string; name: string; area: string | null; cover_image_url: string | null; image_url: string | null } | null;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export async function getTopics(): Promise<Topic[]> {
  const { data } = await supabase.from("topics").select("id, slug, name, description").order("sort_order");
  return data ?? [];
}

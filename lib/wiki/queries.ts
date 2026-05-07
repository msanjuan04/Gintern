import "server-only";

import { createClient } from "@/lib/supabase/server";

export type WikiPageListItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  is_published: boolean;
  updated_at: string;
  owner_name: string | null;
};

export async function listWikiPages(): Promise<WikiPageListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_pages")
    .select(
      "id, slug, title, category, content, is_published, updated_at, owner:team_members!knowledge_pages_owner_id_fkey(full_name, email)"
    )
    .order("updated_at", { ascending: false });
  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }

  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      content: row.content,
      is_published: row.is_published,
      updated_at: row.updated_at,
      owner_name: owner?.full_name || owner?.email || null,
    };
  });
}

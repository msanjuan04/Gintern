import "server-only";

import { createClient } from "@/lib/supabase/server";

export type FileListItem = {
  id: string;
  name: string;
  tag: string | null;
  external_url: string | null;
  storage_path: string | null;
  size_bytes: number | null;
  created_at: string;
  owner_name: string | null;
  signed_url: string | null;
};

export async function listKnowledgeFiles(): Promise<FileListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select(
      "id, name, tag, external_url, storage_path, size_bytes, created_at, owner:team_members(full_name, email)"
    )
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "PGRST205") return [];
    throw error;
  }

  const rows = (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      external_url: row.external_url,
      storage_path: row.storage_path,
      size_bytes: row.size_bytes,
      created_at: row.created_at,
      owner_name: owner?.full_name || owner?.email || null,
      signed_url: null as string | null,
    };
  });

  const paths = rows
    .map((row) => row.storage_path)
    .filter((value): value is string => Boolean(value));
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("invoices").createSignedUrls(paths, 3600);
    const signedMap = new Map<string, string>();
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
    }
    for (const row of rows) {
      if (row.storage_path) row.signed_url = signedMap.get(row.storage_path) ?? null;
    }
  }

  return rows;
}

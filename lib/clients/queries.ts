import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ClientRow } from "@/types/database";

export async function listClients(opts?: {
  includeInactive?: boolean;
  query?: string;
  stage?: ClientRow["stage"] | "all";
}): Promise<ClientRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("nombre", { ascending: true });

  if (!opts?.includeInactive) {
    query = query.eq("activo", true);
  }

  if (opts?.stage && opts.stage !== "all") {
    query = query.eq("stage", opts.stage);
  }

  const normalizedQuery = opts?.query?.trim();
  if (normalizedQuery) {
    const escaped = normalizedQuery.replace(/[%_]/g, "");
    query = query.or(
      `nombre.ilike.%${escaped}%,contacto.ilike.%${escaped}%,email.ilike.%${escaped}%,telefono.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as ClientRow) ?? null;
}

export type ClientInteractionRow = {
  id: string;
  content: string;
  interaction_type: string;
  created_at: string;
  author: { full_name: string | null; email: string | null } | null;
};

export async function listClientInteractions(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_interactions")
    .select(
      "id, content, interaction_type, created_at, author:team_members!client_interactions_author_id_fkey(full_name, email)"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    content: string;
    interaction_type: string;
    created_at: string;
    author: Array<{ full_name: string | null; email: string | null }>;
  }>).map((row) => ({
    ...row,
    author: row.author?.[0] ?? null,
  }));
}

export type ClientProjectRow = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
};

export async function listClientProjects(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, start_date, end_date, budget")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientProjectRow[];
}

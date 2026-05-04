import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ProposalStatus } from "@/types/database";

export type ProposalListItem = {
  id: string;
  code: string | null;
  title: string;
  status: ProposalStatus;
  amount: number;
  valid_until: string | null;
  created_at: string;
  client_name: string | null;
  owner_name: string | null;
};

export type ProposalKpis = {
  totalOpen: number;
  inNegotiation: number;
  expired: number;
  winRate: number;
};

function isMissingRelationError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205";
}

export async function listProposals(): Promise<ProposalListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select(
      "id, code, title, status, amount, valid_until, created_at, client:clients(nombre), owner:team_members(full_name, email)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return ((data ?? []) as Array<{
    id: string;
    code: string | null;
    title: string;
    status: ProposalStatus;
    amount: number;
    valid_until: string | null;
    created_at: string;
    client: { nombre: string | null } | Array<{ nombre: string | null }> | null;
    owner:
      | { full_name: string | null; email: string | null }
      | Array<{ full_name: string | null; email: string | null }>
      | null;
  }>).map((row) => {
    const client = Array.isArray(row.client) ? row.client[0] : row.client;
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      status: row.status,
      amount: row.amount,
      valid_until: row.valid_until,
      created_at: row.created_at,
      client_name: client?.nombre ?? null,
      owner_name: owner?.full_name || owner?.email || null,
    };
  });
}

export async function getProposalKpis(
  proposals?: ProposalListItem[]
): Promise<ProposalKpis> {
  const rows = proposals ?? (await listProposals());
  const openStatuses: ProposalStatus[] = ["draft", "sent", "in_review", "negotiation"];
  const totalOpen = rows.filter((row) => openStatuses.includes(row.status)).length;
  const inNegotiation = rows.filter((row) => row.status === "negotiation").length;
  const today = new Date().toISOString().slice(0, 10);
  const expired = rows.filter(
    (row) => row.valid_until && row.valid_until < today && openStatuses.includes(row.status)
  ).length;
  const won = rows.filter((row) => row.status === "won").length;
  const closed = rows.filter((row) => row.status === "won" || row.status === "lost").length;

  return {
    totalOpen,
    inNegotiation,
    expired,
    winRate: closed > 0 ? Math.round((won / closed) * 100) : 0,
  };
}

export async function listProposalFormData() {
  const supabase = await createClient();
  const [clientsRes, membersRes] = await Promise.all([
    supabase.from("clients").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("team_members").select("id, full_name, email").eq("is_active", true),
  ]);

  if (clientsRes.error && !isMissingRelationError(clientsRes.error)) throw clientsRes.error;
  if (membersRes.error && !isMissingRelationError(membersRes.error)) throw membersRes.error;

  return {
    clients: clientsRes.data ?? [],
    owners:
      membersRes.data?.map((m) => ({
        id: m.id,
        name: m.full_name || m.email || "Compañero",
      })) ?? [],
  };
}

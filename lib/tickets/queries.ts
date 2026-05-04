import "server-only";

import { createClient } from "@/lib/supabase/server";

type TicketStatus = "backlog" | "in_progress" | "blocked" | "in_review" | "done";

export type TicketBoardItem = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: "normal" | "high" | "fire";
  due_date: string | null;
  assignee_id: string | null;
  reporter_id: string;
  assignee_name: string | null;
  client_name: string | null;
  spent_minutes: number;
  attachments: Array<{
    id: string;
    label: string | null;
    external_url: string | null;
    file_path: string | null;
    file_url: string | null;
  }>;
  cc_members: Array<{ id: string; name: string }>;
  has_running_timer: boolean;
  comments: Array<{
    id: string;
    body: string;
    created_at: string;
    author_name: string;
    mentions: Array<{ id: string; name: string }>;
  }>;
  dependencies: Array<{ id: string; code: string | null; title: string }>;
  activity_count: number;
};

export async function listTicketBoard(): Promise<TicketBoardItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vw_ticket_overview")
    .select(
      "id, code, title, description, status, priority, due_date, assignee_id, reporter_id, assignee_name, client_name, spent_minutes, has_running_timer, activity_count"
    )
    .order("created_at", { ascending: false });

  if (error) {
    // Mientras la migración de Fase 1 no esté aplicada, evitamos romper la UI.
    if (error.code === "PGRST205") return [];
    throw error;
  }

  const tickets = (data ?? []) as Array<
    Omit<TicketBoardItem, "attachments" | "cc_members" | "comments" | "dependencies">
  >;

  const ids = tickets.map((t) => t.id);
  if (ids.length === 0) return [];

  const { data: attachments, error: attachmentsError } = await supabase
    .from("ticket_attachments")
    .select("id, ticket_id, label, external_url, file_path")
    .in("ticket_id", ids);
  if (attachmentsError && attachmentsError.code !== "PGRST205") throw attachmentsError;

  const paths = (attachments ?? [])
    .map((a) => a.file_path)
    .filter((p): p is string => typeof p === "string");
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("invoices")
      .createSignedUrls(paths, 60 * 60);
    for (const row of signed ?? []) {
      if (row.path && row.signedUrl) signedByPath.set(row.path, row.signedUrl);
    }
  }

  const attachmentsByTicket = new Map<
    string,
    Array<{
      id: string;
      label: string | null;
      external_url: string | null;
      file_path: string | null;
      file_url: string | null;
    }>
  >();
  for (const item of attachments ?? []) {
    const current = attachmentsByTicket.get(item.ticket_id) ?? [];
    current.push({
      id: item.id,
      label: item.label,
      external_url: item.external_url,
      file_path: item.file_path,
      file_url: item.file_path ? signedByPath.get(item.file_path) ?? null : null,
    });
    attachmentsByTicket.set(item.ticket_id, current);
  }

  const { data: watchers, error: watchersError } = await supabase
    .from("ticket_watchers")
    .select(
      "ticket_id, member:team_members!ticket_watchers_team_member_id_fkey(id, full_name, email)"
    )
    .in("ticket_id", ids);
  if (watchersError && watchersError.code !== "PGRST205") throw watchersError;

  const watchersByTicket = new Map<string, Array<{ id: string; name: string }>>();
  for (const row of watchers ?? []) {
    const member = Array.isArray(row.member) ? row.member[0] : row.member;
    if (!member?.id) continue;
    const current = watchersByTicket.get(row.ticket_id) ?? [];
    current.push({
      id: member.id,
      name: member.full_name || member.email || "Compañero",
    });
    watchersByTicket.set(row.ticket_id, current);
  }

  const { data: comments, error: commentsError } = await supabase
    .from("ticket_comments")
    .select(
      "id, ticket_id, body, mentions, created_at, author:team_members!ticket_comments_author_id_fkey(full_name, email)"
    )
    .in("ticket_id", ids)
    .order("created_at", { ascending: false });
  if (commentsError && commentsError.code !== "PGRST205") throw commentsError;

  const commentsByTicket = new Map<
    string,
    Array<{
      id: string;
      body: string;
      created_at: string;
      author_name: string;
      mentions: Array<{ id: string; name: string }>;
    }>
  >();
  const allMentionIds = new Set<string>();
  for (const row of comments ?? []) {
    const mentionIds = Array.isArray(row.mentions)
      ? row.mentions.filter((value): value is string => typeof value === "string")
      : [];
    for (const mentionId of mentionIds) allMentionIds.add(mentionId);
  }

  const mentionNameById = new Map<string, string>();
  if (allMentionIds.size > 0) {
    const { data: mentionMembers, error: mentionMembersError } = await supabase
      .from("team_members")
      .select("id, full_name, email")
      .in("id", Array.from(allMentionIds));
    if (mentionMembersError && mentionMembersError.code !== "PGRST205") {
      throw mentionMembersError;
    }
    for (const member of mentionMembers ?? []) {
      mentionNameById.set(member.id, member.full_name || member.email || "Compañero");
    }
  }

  for (const row of comments ?? []) {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    const current = commentsByTicket.get(row.ticket_id) ?? [];
    const mentionIds = Array.isArray(row.mentions)
      ? row.mentions.filter((value): value is string => typeof value === "string")
      : [];
    current.push({
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      author_name: author?.full_name || author?.email || "Equipo",
      mentions: mentionIds.map((id) => ({
        id,
        name: mentionNameById.get(id) ?? "Compañero",
      })),
    });
    commentsByTicket.set(row.ticket_id, current);
  }

  const { data: deps, error: depsError } = await supabase
    .from("ticket_dependencies")
    .select("ticket_id, depends_on_ticket_id")
    .in("ticket_id", ids);
  if (depsError && depsError.code !== "PGRST205") throw depsError;

  const dependedIds = Array.from(
    new Set(
      (deps ?? [])
        .map((row) => row.depends_on_ticket_id)
        .filter((value): value is string => typeof value === "string")
    )
  );

  const ticketMetaById = new Map<string, { code: string | null; title: string }>();
  if (dependedIds.length > 0) {
    const { data: dependedTickets, error: dependedTicketsError } = await supabase
      .from("tickets")
      .select("id, code, title")
      .in("id", dependedIds);
    if (dependedTicketsError && dependedTicketsError.code !== "PGRST205") {
      throw dependedTicketsError;
    }
    for (const row of dependedTickets ?? []) {
      ticketMetaById.set(row.id, { code: row.code ?? null, title: row.title });
    }
  }

  const depsByTicket = new Map<
    string,
    Array<{ id: string; code: string | null; title: string }>
  >();
  for (const row of deps ?? []) {
    const current = depsByTicket.get(row.ticket_id) ?? [];
    const meta = ticketMetaById.get(row.depends_on_ticket_id);
    if (!meta) continue;
    current.push({
      id: row.depends_on_ticket_id,
      code: meta.code,
      title: meta.title,
    });
    depsByTicket.set(row.ticket_id, current);
  }

  return tickets.map((t) => ({
    ...t,
    attachments: attachmentsByTicket.get(t.id) ?? [],
    cc_members: watchersByTicket.get(t.id) ?? [],
    comments: commentsByTicket.get(t.id) ?? [],
    dependencies: depsByTicket.get(t.id) ?? [],
    activity_count: t.activity_count ?? 0,
  }));
}

export async function listTicketFormData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [clientsRes, membersRes] = await Promise.all([
    supabase.from("clients").select("id, nombre").eq("activo", true).order("nombre"),
    supabase
      .from("team_members")
      .select("id, full_name, email")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  if (clientsRes.error && clientsRes.error.code !== "PGRST205") throw clientsRes.error;
  if (membersRes.error && membersRes.error.code !== "PGRST205") throw membersRes.error;

  return {
    clients: clientsRes.data ?? [],
    members:
      membersRes.data?.map((m) => ({
        id: m.id,
        name: m.full_name || m.email,
      })) ?? [],
    currentUserId: user?.id ?? null,
  };
}

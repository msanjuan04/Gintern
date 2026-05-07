import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CalendarEventStatus = "paid" | "pending" | "overdue";

export type CalendarEventKind = "subscription" | "credential" | "manual";
export type CalendarEventKindExtended =
  | "subscription"
  | "credential"
  | "manual"
  | "ticket"
  | "goal"
  | "proposal";

export type CalendarEvent = {
  id: string;
  source_id: string | null;
  date: string;
  status: CalendarEventStatus;
  kind: CalendarEventKindExtended;
  href: string;
  title: string;
  subtitle: string | null;
  total: number;
  client_name: string | null;
  manual_description?: string | null;
  manual_time?: string | null;
  manual_category?: "meeting" | "deadline" | "milestone" | "note" | "other" | null;
  manual_priority?: "normal" | "high" | "critical" | null;
  is_done?: boolean;
};

export async function listCalendarEvents(
  startISO: string,
  endISO: string,
  todayISO: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [
    { data: renewalRows, error: renewalErr },
    { data: rotationRows, error: rotationErr },
    { data: manualRows, error: manualErr },
    { data: ticketRows, error: ticketErr },
    { data: goalRows, error: goalErr },
    { data: proposalRows, error: proposalErr },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, name, provider, amount, next_renewal, is_active")
      .eq("is_active", true)
      .gte("next_renewal", startISO)
      .lte("next_renewal", endISO),
    supabase
      .from("credentials")
      .select(
        "id, service, account_identifier, rotation_due_on, scope, client:clients(nombre)"
      )
      .not("rotation_due_on", "is", null)
      .gte("rotation_due_on", startISO)
      .lte("rotation_due_on", endISO),
    supabase
      .from("calendar_manual_events")
      .select("id, title, description, event_date, event_time, category, priority, is_done")
      .gte("event_date", startISO)
      .lte("event_date", endISO),
    supabase
      .from("tickets")
      .select("id, code, title, due_date, priority, status, client:clients(nombre)")
      .not("due_date", "is", null)
      .neq("status", "done")
      .gte("due_date", startISO)
      .lte("due_date", endISO),
    supabase
      .from("organization_goals")
      .select("id, title, scope, target_date, target_value, current_value")
      .not("target_date", "is", null)
      .gte("target_date", startISO)
      .lte("target_date", endISO),
    supabase
      .from("proposals")
      .select("id, code, title, valid_until, status, client:clients(nombre)")
      .in("status", ["draft", "sent", "in_review", "negotiation"])
      .not("valid_until", "is", null)
      .gte("valid_until", startISO)
      .lte("valid_until", endISO),
  ]);

  if (renewalErr && renewalErr.code !== "PGRST205") throw renewalErr;
  if (rotationErr && rotationErr.code !== "PGRST205") throw rotationErr;
  if (manualErr && manualErr.code !== "PGRST205") throw manualErr;
  if (ticketErr && ticketErr.code !== "PGRST205") throw ticketErr;
  if (goalErr && goalErr.code !== "PGRST205") throw goalErr;
  if (proposalErr && proposalErr.code !== "PGRST205") throw proposalErr;

  const events: CalendarEvent[] = [];

  for (const row of (renewalRows ?? []) as Array<{
    id: string;
    name: string;
    provider: string;
    amount: number;
    next_renewal: string | null;
  }>) {
    if (!row.next_renewal) continue;
    events.push({
      id: `${row.id}-renewal`,
      source_id: row.id,
      date: row.next_renewal,
      status: "pending",
      kind: "subscription",
      href: "/calendario",
      title: row.name,
      subtitle: `Renovación · ${row.provider}`,
      total: Number(row.amount ?? 0),
      client_name: null,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    });
  }

  for (const row of (rotationRows ?? []) as Array<{
    id: string;
    service: string;
    account_identifier: string;
    rotation_due_on: string;
    scope: "internal" | "client";
    client: { nombre: string | null } | Array<{ nombre: string | null }> | null;
  }>) {
    const client = Array.isArray(row.client) ? row.client[0] : row.client;
    events.push({
      id: `${row.id}-rotation`,
      source_id: row.id,
      date: row.rotation_due_on,
      status: row.rotation_due_on < todayISO ? "overdue" : "pending",
      kind: "credential",
      href: "/boveda",
      title: row.service,
      subtitle:
        row.scope === "client"
          ? `Rotación cliente · ${client?.nombre ?? row.account_identifier}`
          : `Rotación interna · ${row.account_identifier}`,
      total: 0,
      client_name: client?.nombre ?? null,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    });
  }

  for (const row of (manualRows ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    category: "meeting" | "deadline" | "milestone" | "note" | "other";
    priority: "normal" | "high" | "critical";
    is_done: boolean;
  }>) {
    const overdue = row.event_date < todayISO;
    events.push({
      id: `${row.id}-manual`,
      source_id: row.id,
      date: row.event_date,
      status: row.is_done ? "paid" : overdue ? "overdue" : "pending",
      kind: "manual",
      href: "/calendario",
      title: row.title,
      subtitle: `${manualCategoryLabel(row.category)}${row.event_time ? ` · ${row.event_time.slice(0, 5)}` : ""}${row.priority !== "normal" ? ` · ${manualPriorityLabel(row.priority)}` : ""}`,
      total: 0,
      client_name: null,
      manual_description: row.description,
      manual_time: row.event_time,
      manual_category: row.category,
      manual_priority: row.priority,
      is_done: row.is_done,
    });
  }

  for (const row of (ticketRows ?? []) as Array<{
    id: string;
    code: string | null;
    title: string;
    due_date: string;
    priority: "normal" | "high" | "fire";
    status: "backlog" | "in_progress" | "blocked" | "in_review" | "done";
    client: { nombre: string | null } | Array<{ nombre: string | null }> | null;
  }>) {
    const client = Array.isArray(row.client) ? row.client[0] : row.client;
    events.push({
      id: `${row.id}-ticket`,
      source_id: row.id,
      date: row.due_date,
      status: row.due_date < todayISO ? "overdue" : "pending",
      kind: "ticket",
      href: "/tickets",
      title: row.code ? `${row.code} · ${row.title}` : row.title,
      subtitle: `Ticket${client?.nombre ? ` · ${client.nombre}` : ""}${row.priority !== "normal" ? ` · ${ticketPriorityLabel(row.priority)}` : ""}`,
      total: 0,
      client_name: client?.nombre ?? null,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    });
  }

  for (const row of (goalRows ?? []) as Array<{
    id: string;
    title: string;
    scope: "team" | "personal";
    target_date: string;
    target_value: number;
    current_value: number;
  }>) {
    const target = Number(row.target_value ?? 0);
    const current = Number(row.current_value ?? 0);
    const progress = target > 0 ? Math.round((current / target) * 100) : 0;
    const completed = target > 0 ? current >= target : false;
    events.push({
      id: `${row.id}-goal`,
      source_id: row.id,
      date: row.target_date,
      status: completed ? "paid" : row.target_date < todayISO ? "overdue" : "pending",
      kind: "goal",
      href: "/organizacion/objetivos",
      title: row.title,
      subtitle: `Objetivo ${row.scope === "team" ? "equipo" : "personal"} · ${progress}%`,
      total: 0,
      client_name: null,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: completed,
    });
  }

  for (const row of (proposalRows ?? []) as Array<{
    id: string;
    code: string | null;
    title: string;
    valid_until: string;
    status: "draft" | "sent" | "in_review" | "negotiation" | "won" | "lost";
    client: { nombre: string | null } | Array<{ nombre: string | null }> | null;
  }>) {
    const client = Array.isArray(row.client) ? row.client[0] : row.client;
    events.push({
      id: `${row.id}-proposal`,
      source_id: row.id,
      date: row.valid_until,
      status: row.valid_until < todayISO ? "overdue" : "pending",
      kind: "proposal",
      href: "/propuestas",
      title: row.code ? `${row.code} · ${row.title}` : row.title,
      subtitle: `Vence propuesta${client?.nombre ? ` · ${client.nombre}` : ""}`,
      total: 0,
      client_name: client?.nombre ?? null,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    });
  }

  return events;
}

function manualCategoryLabel(value: "meeting" | "deadline" | "milestone" | "note" | "other") {
  if (value === "meeting") return "Reunión";
  if (value === "deadline") return "Fecha límite";
  if (value === "milestone") return "Hito";
  if (value === "note") return "Nota";
  return "Evento";
}

function manualPriorityLabel(value: "normal" | "high" | "critical") {
  if (value === "high") return "Prioridad alta";
  if (value === "critical") return "Prioridad crítica";
  return "Prioridad normal";
}

function ticketPriorityLabel(value: "normal" | "high" | "fire") {
  if (value === "fire") return "Urgencia fuego";
  if (value === "high") return "Prioridad alta";
  return "Prioridad normal";
}

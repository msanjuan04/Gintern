import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CalendarEventStatus = "paid" | "pending" | "overdue";

export type CalendarEventKind = "subscription" | "credential" | "manual";

export type CalendarEvent = {
  id: string;
  source_id: string | null;
  date: string;
  status: CalendarEventStatus;
  kind: CalendarEventKind;
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
  ]);

  if (renewalErr && renewalErr.code !== "PGRST205") throw renewalErr;
  if (rotationErr && rotationErr.code !== "PGRST205") throw rotationErr;
  if (manualErr && manualErr.code !== "PGRST205") throw manualErr;

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

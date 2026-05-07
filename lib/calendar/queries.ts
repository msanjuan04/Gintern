import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus, Scope } from "@/types/database";

export type CalendarEventStatus = "paid" | "pending" | "overdue";

export type CalendarEvent = {
  id: string;
  source_id: string | null;
  date: string; // YYYY-MM-DD (la fecha en la que se pinta)
  status: CalendarEventStatus;
  kind: "invoice" | "subscription" | "credential" | "manual";
  href: string;
  title: string;
  subtitle: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  total: number;
  base_imponible: number;
  client_name: string | null;
  fecha_vencimiento: string;
  fecha_cobro: string | null;
  source_status: InvoiceStatus;
  scope: Scope;
  manual_description?: string | null;
  manual_time?: string | null;
  manual_category?: "meeting" | "deadline" | "milestone" | "note" | "other" | null;
  manual_priority?: "normal" | "high" | "critical" | null;
  is_done?: boolean;
};

type Row = {
  id: string;
  invoice_number: string;
  total: number;
  base_imponible: number;
  status: InvoiceStatus;
  scope: Scope;
  fecha_vencimiento: string;
  fecha_cobro: string | null;
  client: { nombre: string | null } | null;
};

/**
 * Devuelve los eventos del calendario en un rango de fechas (inclusive).
 *
 * Genera dos tipos de eventos:
 * - Cobrados: se pintan en su `fecha_cobro` con estado verde.
 * - Pendientes / vencidos: se pintan en su `fecha_vencimiento` con estado
 *   ámbar si el vencimiento aún no ha pasado, rojo si sí.
 */
export async function listCalendarEvents(
  startISO: string,
  endISO: string,
  todayISO: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const select =
    "id, invoice_number, total, base_imponible, status, scope, fecha_vencimiento, fecha_cobro, client:clients(nombre)";

  const [
    { data: dueRows, error: dueErr },
    { data: paidRows, error: paidErr },
    { data: renewalRows, error: renewalErr },
    { data: rotationRows, error: rotationErr },
    { data: manualRows, error: manualErr },
  ] =
    await Promise.all([
      supabase
        .from("invoices")
        .select(select)
        .in("status", ["sent", "overdue"])
        .gte("fecha_vencimiento", startISO)
        .lte("fecha_vencimiento", endISO),
      supabase
        .from("invoices")
        .select(select)
        .eq("status", "paid")
        .gte("fecha_cobro", startISO)
        .lte("fecha_cobro", endISO),
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

  // Tabla legacy `invoices` eliminada en migración de limpieza: no romper calendario.
  if (dueErr && dueErr.code !== "PGRST205") throw dueErr;
  if (paidErr && paidErr.code !== "PGRST205") throw paidErr;
  if (renewalErr && renewalErr.code !== "PGRST205") throw renewalErr;
  if (rotationErr && rotationErr.code !== "PGRST205") throw rotationErr;
  if (manualErr && manualErr.code !== "PGRST205") throw manualErr;

  const events: CalendarEvent[] = [];

  for (const row of (dueErr?.code === "PGRST205" ? [] : (dueRows ?? [])) as unknown as Row[]) {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < todayISO ? "overdue" : "pending";
    events.push({
      id: `${row.id}-due`,
      source_id: row.id,
      date: row.fecha_vencimiento,
      status,
      kind: "invoice",
      href: `/facturas/${row.id}`,
      title: row.client?.nombre ?? row.invoice_number,
      subtitle: row.invoice_number,
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    });
  }

  for (const row of (paidErr?.code === "PGRST205" ? [] : (paidRows ?? [])) as unknown as Row[]) {
    if (!row.fecha_cobro) continue;
    events.push({
      id: `${row.id}-paid`,
      source_id: row.id,
      date: row.fecha_cobro,
      status: "paid",
      kind: "invoice",
      href: `/facturas/${row.id}`,
      title: row.client?.nombre ?? row.invoice_number,
      subtitle: row.invoice_number,
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: true,
    });
  }

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
      invoice_id: null,
      invoice_number: null,
      total: Number(row.amount ?? 0),
      base_imponible: Number(row.amount ?? 0),
      client_name: null,
      fecha_vencimiento: row.next_renewal,
      fecha_cobro: null,
      source_status: "sent",
      scope: "gnerai",
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
      invoice_id: null,
      invoice_number: null,
      total: 0,
      base_imponible: 0,
      client_name: client?.nombre ?? null,
      fecha_vencimiento: row.rotation_due_on,
      fecha_cobro: null,
      source_status: "sent",
      scope: "gnerai",
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
      invoice_id: null,
      invoice_number: null,
      total: 0,
      base_imponible: 0,
      client_name: null,
      fecha_vencimiento: row.event_date,
      fecha_cobro: null,
      source_status: "sent",
      scope: "gnerai",
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

export async function listUpcoming(
  fromISO: string,
  toISO: string,
  limit = 8
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const select =
    "id, invoice_number, total, base_imponible, status, scope, fecha_vencimiento, fecha_cobro, client:clients(nombre)";

  const { data, error } = await supabase
    .from("invoices")
    .select(select)
    .in("status", ["sent", "overdue"])
    .gte("fecha_vencimiento", fromISO)
    .lte("fecha_vencimiento", toISO)
    .order("fecha_vencimiento", { ascending: true })
    .limit(limit);

  if (error && error.code !== "PGRST205") throw error;
  if (error?.code === "PGRST205") return [];

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < fromISO ? "overdue" : "pending";
    return {
      id: `${row.id}-due`,
      source_id: row.id,
      date: row.fecha_vencimiento,
      status,
      kind: "invoice",
      href: `/facturas/${row.id}`,
      title: row.client?.nombre ?? row.invoice_number,
      subtitle: row.invoice_number,
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
      manual_description: null,
      manual_time: null,
      manual_category: null,
      manual_priority: null,
      is_done: false,
    };
  });
}

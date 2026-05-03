import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus, Scope } from "@/types/database";

export type CalendarEventStatus = "paid" | "pending" | "overdue";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD (la fecha en la que se pinta)
  status: CalendarEventStatus;
  invoice_id: string;
  invoice_number: string;
  total: number;
  base_imponible: number;
  client_name: string | null;
  fecha_vencimiento: string;
  fecha_cobro: string | null;
  source_status: InvoiceStatus;
  scope: Scope;
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
  const supabase = createClient();

  const select =
    "id, invoice_number, total, base_imponible, status, scope, fecha_vencimiento, fecha_cobro, client:clients(nombre)";

  const [{ data: dueRows, error: dueErr }, { data: paidRows, error: paidErr }] =
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
    ]);

  if (dueErr) throw dueErr;
  if (paidErr) throw paidErr;

  const events: CalendarEvent[] = [];

  for (const row of (dueRows ?? []) as unknown as Row[]) {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < todayISO ? "overdue" : "pending";
    events.push({
      id: `${row.id}-due`,
      date: row.fecha_vencimiento,
      status,
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
    });
  }

  for (const row of (paidRows ?? []) as unknown as Row[]) {
    if (!row.fecha_cobro) continue;
    events.push({
      id: `${row.id}-paid`,
      date: row.fecha_cobro,
      status: "paid",
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
    });
  }

  return events;
}

export async function listUpcoming(
  fromISO: string,
  toISO: string,
  limit = 8
): Promise<CalendarEvent[]> {
  const supabase = createClient();

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

  if (error) throw error;

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < fromISO ? "overdue" : "pending";
    return {
      id: `${row.id}-due`,
      date: row.fecha_vencimiento,
      status,
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      total: Number(row.total),
      base_imponible: Number(row.base_imponible),
      client_name: row.client?.nombre ?? null,
      fecha_vencimiento: row.fecha_vencimiento,
      fecha_cobro: row.fecha_cobro,
      source_status: row.status,
      scope: row.scope,
    };
  });
}

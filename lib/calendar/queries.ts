import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus, Scope } from "@/types/database";

export type CalendarEventStatus = "paid" | "pending" | "overdue";

export type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD (la fecha en la que se pinta)
  status: CalendarEventStatus;
  kind: "invoice" | "subscription" | "credential";
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
    ]);

  if (dueErr) throw dueErr;
  if (paidErr) throw paidErr;
  if (renewalErr && renewalErr.code !== "PGRST205") throw renewalErr;
  if (rotationErr && rotationErr.code !== "PGRST205") throw rotationErr;

  const events: CalendarEvent[] = [];

  for (const row of (dueRows ?? []) as unknown as Row[]) {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < todayISO ? "overdue" : "pending";
    events.push({
      id: `${row.id}-due`,
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
    });
  }

  for (const row of (paidRows ?? []) as unknown as Row[]) {
    if (!row.fecha_cobro) continue;
    events.push({
      id: `${row.id}-paid`,
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
    });
  }

  return events;
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

  if (error) throw error;

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const status: CalendarEventStatus =
      row.fecha_vencimiento < fromISO ? "overdue" : "pending";
    return {
      id: `${row.id}-due`,
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
    };
  });
}

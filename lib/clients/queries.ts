import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ClientRow, InvoiceRow } from "@/types/database";

export async function listClients(opts?: {
  includeInactive?: boolean;
}): Promise<ClientRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("nombre", { ascending: true });

  if (!opts?.includeInactive) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as ClientRow) ?? null;
}

export type PuntualidadEstado = "verde" | "ambar" | "rojo" | "sin-datos";

export type ClientStats = {
  total_facturado: number; // suma de base_imponible de facturas no anuladas
  total_cobrado: number; // suma de total de facturas paid
  pendiente: number; // suma de total de facturas sent + overdue
  count_facturas: number;
  count_paid: number;
  ticket_medio: number;
  dias_promedio_cobro: number | null; // días desde fecha_emision a fecha_cobro
  ultimo_cobro: string | null;
  proximo_vencimiento: string | null;
  puntualidad: PuntualidadEstado;
};

type StatsRow = Pick<
  InvoiceRow,
  | "id"
  | "base_imponible"
  | "total"
  | "status"
  | "fecha_emision"
  | "fecha_vencimiento"
  | "fecha_cobro"
>;

export async function getClientStats(clientId: string): Promise<ClientStats> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, base_imponible, total, status, fecha_emision, fecha_vencimiento, fecha_cobro"
    )
    .eq("client_id", clientId)
    .neq("status", "cancelled");

  if (error) throw error;

  const rows = (data ?? []) as unknown as StatsRow[];

  let total_facturado = 0;
  let total_cobrado = 0;
  let pendiente = 0;
  let count_paid = 0;
  let dias_total = 0;
  let dias_count = 0;
  let ultimo_cobro: string | null = null;
  let proximo_vencimiento: string | null = null;

  const today = new Date().toISOString().slice(0, 10);

  for (const r of rows) {
    if (r.status !== "draft") {
      total_facturado += Number(r.base_imponible);
    }
    if (r.status === "paid") {
      total_cobrado += Number(r.total);
      count_paid += 1;
      if (r.fecha_cobro) {
        const dias = Math.floor(
          (new Date(r.fecha_cobro).getTime() -
            new Date(r.fecha_emision).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        dias_total += dias;
        dias_count += 1;
        if (!ultimo_cobro || r.fecha_cobro > ultimo_cobro) {
          ultimo_cobro = r.fecha_cobro;
        }
      }
    } else if (r.status === "sent" || r.status === "overdue") {
      pendiente += Number(r.total);
      if (
        r.fecha_vencimiento >= today &&
        (!proximo_vencimiento || r.fecha_vencimiento < proximo_vencimiento)
      ) {
        proximo_vencimiento = r.fecha_vencimiento;
      }
    }
  }

  const ticket_medio =
    rows.length > 0 ? Number((total_facturado / rows.length).toFixed(2)) : 0;
  const dias_promedio_cobro =
    dias_count > 0 ? Number((dias_total / dias_count).toFixed(1)) : null;

  let puntualidad: PuntualidadEstado = "sin-datos";
  if (dias_promedio_cobro != null) {
    if (dias_promedio_cobro <= 30) puntualidad = "verde";
    else if (dias_promedio_cobro <= 60) puntualidad = "ambar";
    else puntualidad = "rojo";
  }

  return {
    total_facturado: Number(total_facturado.toFixed(2)),
    total_cobrado: Number(total_cobrado.toFixed(2)),
    pendiente: Number(pendiente.toFixed(2)),
    count_facturas: rows.length,
    count_paid,
    ticket_medio,
    dias_promedio_cobro,
    ultimo_cobro,
    proximo_vencimiento,
    puntualidad,
  };
}

export type ClientInvoiceListItem = StatsRow & {
  invoice_number: string;
  scope: string;
  recurrence: string;
};

export async function listClientInvoices(
  clientId: string,
  limit = 50
): Promise<ClientInvoiceListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, base_imponible, total, status, scope, recurrence, fecha_emision, fecha_vencimiento, fecha_cobro"
    )
    .eq("client_id", clientId)
    .order("fecha_emision", { ascending: false })
    .order("sequence_number", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ClientInvoiceListItem[];
}

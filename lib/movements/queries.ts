import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ClientRow,
  InvoiceRow,
  MovementRow,
  MovementType,
  Scope,
  UserRow,
} from "@/types/database";

export type MovementListItem = MovementRow & {
  user: Pick<UserRow, "id" | "nombre" | "prefix_factura"> | null;
  client: Pick<ClientRow, "id" | "nombre"> | null;
  invoice: Pick<InvoiceRow, "id" | "invoice_number"> | null;
};

export type MovementFilters = {
  scope?: Scope;
  tipo?: MovementType;
  userId?: string;
  year?: number;
  quarter?: number;
};

export async function listMovements(
  filters: MovementFilters = {}
): Promise<MovementListItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("movements")
    .select(
      `*,
       user:users(id,nombre,prefix_factura),
       client:clients(id,nombre),
       invoice:invoices(id,invoice_number)`
    )
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.scope) query = query.eq("scope", filters.scope);
  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  if (filters.userId) query = query.eq("user_id", filters.userId);

  if (filters.year && filters.quarter) {
    const startMonth = (filters.quarter - 1) * 3 + 1;
    const endMonth = filters.quarter * 3;
    const start = `${filters.year}-${String(startMonth).padStart(2, "0")}-01`;
    const endDate = new Date(filters.year, endMonth, 0);
    const end = `${filters.year}-${String(endMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    query = query.gte("fecha", start).lte("fecha", end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MovementListItem[];
}

export type DashboardKpis = {
  totalQ: number;
  pendienteCobro: number;
  ingresosCount: number;
  gastosTotal: number;
};

function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endDate = new Date(year, endMonth, 0);
  const end = `${year}-${String(endMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

export async function getDashboardKpis(
  userId: string,
  year: number,
  quarter: number
): Promise<DashboardKpis> {
  const supabase = createClient();
  const { start, end } = quarterRange(year, quarter);

  const { data: rows, error } = await supabase
    .from("movements")
    .select("tipo, base_imponible, total, cobrado")
    .eq("user_id", userId)
    .eq("scope", "gnerai")
    .gte("fecha", start)
    .lte("fecha", end);

  if (error) throw error;

  let totalQ = 0;
  let pendienteCobro = 0;
  let ingresosCount = 0;
  let gastosTotal = 0;

  for (const r of rows ?? []) {
    const base = Number(r.base_imponible);
    const total = Number(r.total);
    if (r.tipo === "income") {
      totalQ += base;
      ingresosCount += 1;
      if (!r.cobrado) pendienteCobro += total;
    } else {
      gastosTotal += base;
    }
  }

  return {
    totalQ: Number(totalQ.toFixed(2)),
    pendienteCobro: Number(pendienteCobro.toFixed(2)),
    ingresosCount,
    gastosTotal: Number(gastosTotal.toFixed(2)),
  };
}

export async function getRecentMovements(
  limit = 10
): Promise<MovementListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movements")
    .select(
      `*,
       user:users(id,nombre,prefix_factura),
       client:clients(id,nombre),
       invoice:invoices(id,invoice_number)`
    )
    .eq("scope", "gnerai")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as MovementListItem[];
}

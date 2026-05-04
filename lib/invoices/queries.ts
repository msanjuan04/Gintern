import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ClientRow,
  InvoiceLineRow,
  InvoiceRow,
  InvoiceStatus,
  Scope,
  UserRow,
} from "@/types/database";

export type InvoiceListItem = InvoiceRow & {
  issuer: Pick<UserRow, "id" | "nombre" | "prefix_factura"> | null;
  client: Pick<ClientRow, "id" | "nombre"> | null;
};

export type InvoiceFilters = {
  status?: InvoiceStatus;
  issuerId?: string;
  scope?: Scope;
  year?: number;
  quarter?: number;
};

export async function listInvoices(
  filters: InvoiceFilters = {}
): Promise<InvoiceListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(
      `*,
       issuer:users!issuer_id(id,nombre,prefix_factura),
       client:clients(id,nombre)`
    )
    .order("fecha_emision", { ascending: false })
    .order("sequence_number", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.issuerId) query = query.eq("issuer_id", filters.issuerId);
  if (filters.scope) query = query.eq("scope", filters.scope);
  if (filters.year) query = query.eq("year", filters.year);

  if (filters.year && filters.quarter) {
    const startMonth = (filters.quarter - 1) * 3 + 1;
    const endMonth = filters.quarter * 3;
    const start = `${filters.year}-${String(startMonth).padStart(2, "0")}-01`;
    const endDate = new Date(filters.year, endMonth, 0);
    const end = `${filters.year}-${String(endMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    query = query.gte("fecha_emision", start).lte("fecha_emision", end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as InvoiceListItem[];
}

export type InvoiceWithRelations = InvoiceRow & {
  issuer: UserRow | null;
  client: ClientRow | null;
  counterparty: UserRow | null;
  lines: InvoiceLineRow[];
};

export async function getInvoice(
  id: string
): Promise<InvoiceWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `*,
       issuer:users!issuer_id(*),
       client:clients(*),
       counterparty:users!counterparty_user_id(*)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: lines, error: linesError } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", id)
    .order("orden", { ascending: true });
  if (linesError) throw linesError;

  return {
    ...(data as unknown as InvoiceRow & {
      issuer: UserRow | null;
      client: ClientRow | null;
      counterparty: UserRow | null;
    }),
    lines: (lines ?? []) as InvoiceLineRow[],
  };
}

export async function listAllPartners(): Promise<UserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as UserRow[];
}

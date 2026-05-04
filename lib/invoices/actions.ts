"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { addMonths, addQuarters, addYears, format, parseISO } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { fmtMoneyTelegram, sendTelegram } from "@/lib/telegram";

import {
  calculateTotals,
  deriveDirection,
  invoiceSchema,
  type InvoiceInput,
} from "./schema";

export type InvoiceFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function nextDueDate(
  fecha: string,
  rec: InvoiceInput["recurrence"]
): string | null {
  if (rec === "unique") return null;
  const d = parseISO(fecha);
  const next =
    rec === "monthly"
      ? addMonths(d, 1)
      : rec === "quarterly"
        ? addQuarters(d, 1)
        : addYears(d, 1);
  return format(next, "yyyy-MM-dd");
}

function parseFormData(formData: FormData): InvoiceInput {
  const linesRaw = String(formData.get("lines") ?? "[]");
  let lines: unknown[];
  try {
    lines = JSON.parse(linesRaw);
  } catch {
    lines = [];
  }

  const num = (v: FormDataEntryValue | null, fallback = 0): number => {
    if (v == null) return fallback;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  };

  return invoiceSchema.parse({
    kind: String(formData.get("kind") ?? "client"),
    client_id: formData.get("client_id")
      ? String(formData.get("client_id"))
      : null,
    counterparty_user_id: formData.get("counterparty_user_id")
      ? String(formData.get("counterparty_user_id"))
      : null,
    concepto: String(formData.get("concepto") ?? ""),
    fecha_emision: String(formData.get("fecha_emision") ?? ""),
    fecha_vencimiento: String(formData.get("fecha_vencimiento") ?? ""),
    iva_pct: num(formData.get("iva_pct"), 21),
    irpf_pct: num(formData.get("irpf_pct"), 15),
    recurrence: String(formData.get("recurrence") ?? "unique"),
    scope: String(formData.get("scope") ?? "gnerai"),
    notas: formData.get("notas") ? String(formData.get("notas")) : undefined,
    status: String(formData.get("status") ?? "draft"),
    lines: (lines as Array<Record<string, unknown>>).map((l) => ({
      descripcion: String(l.descripcion ?? ""),
      cantidad: Number(l.cantidad ?? 0),
      precio_unitario: Number(l.precio_unitario ?? 0),
    })),
  });
}

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  let input: InvoiceInput;
  try {
    input = parseFormData(formData);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        status: "error",
        message: "Revisa los campos marcados.",
        fieldErrors: toFieldErrors(e),
      };
    }
    throw e;
  }

  const totals = calculateTotals(input);
  const direction = deriveDirection(input.kind);
  const year = parseISO(input.fecha_emision).getFullYear();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      issuer_id: user.id,
      year,
      direction,
      kind: input.kind,
      client_id: input.kind === "client" ? input.client_id : null,
      counterparty_user_id:
        input.kind === "internal_compensation"
          ? input.counterparty_user_id
          : null,
      base_imponible: totals.base_imponible,
      iva_pct: input.iva_pct,
      iva_amount: totals.iva_amount,
      irpf_pct: input.irpf_pct,
      irpf_amount: totals.irpf_amount,
      total: totals.total,
      fecha_emision: input.fecha_emision,
      fecha_vencimiento: input.fecha_vencimiento,
      recurrence: input.recurrence,
      next_due_date:
        input.recurrence !== "unique"
          ? nextDueDate(input.fecha_vencimiento, input.recurrence)
          : null,
      status: input.status,
      concepto: input.concepto,
      notas: input.notas,
      scope: input.scope,
    })
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  // Insertar líneas
  const linesPayload = input.lines.map((l, idx) => ({
    invoice_id: invoice.id,
    descripcion: l.descripcion,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    total: Number((l.cantidad * l.precio_unitario).toFixed(2)),
    orden: idx,
  }));
  const { error: linesError } = await supabase
    .from("invoice_lines")
    .insert(linesPayload);

  if (linesError) {
    // Rollback básico: borramos la factura para dejar consistencia
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { status: "error", message: linesError.message };
  }

  revalidatePath("/facturas");
  revalidatePath("/dashboard");
  redirect(`/facturas/${invoice.id}`);
}

export async function markInvoicePaidAction(id: string, fechaCobro: string) {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({ status: "paid", fecha_cobro: fechaCobro })
    .eq("id", id)
    .select(
      "id, invoice_number, total, issuer_id, issuer:users!issuer_id(telegram_chat_id), client:clients(nombre)"
    )
    .single();
  if (error) throw new Error(error.message);

  // Actualizamos el movimiento asociado para reflejar el cobro
  await supabase
    .from("movements")
    .update({ cobrado: true, fecha_cobro: fechaCobro })
    .eq("invoice_id", id);

  // Notificar emisor por Telegram (si tiene chat_id)
  const issuer = (invoice as unknown as {
    issuer: { telegram_chat_id: string | null } | null;
    client: { nombre: string | null } | null;
  }).issuer;
  const client = (invoice as unknown as {
    client: { nombre: string | null } | null;
  }).client;
  if (issuer?.telegram_chat_id) {
    await sendTelegram(
      issuer.telegram_chat_id,
      [
        "✅ *Factura cobrada*",
        "",
        `Número: \`${invoice.invoice_number}\``,
        `Total: ${fmtMoneyTelegram(Number(invoice.total))}`,
        client?.nombre ? `Cliente: ${client.nombre}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  revalidatePath("/dashboard");
}

export async function setInvoiceStatusAction(
  id: string,
  status: "draft" | "sent" | "overdue" | "cancelled"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/facturas");
  redirect("/facturas");
}

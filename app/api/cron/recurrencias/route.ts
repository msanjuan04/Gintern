import {
  addMonths,
  addQuarters,
  addYears,
  format,
  parseISO,
} from "date-fns";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { fmtMoneyTelegram, sendTelegram } from "@/lib/telegram";
import type {
  InvoiceLineRow,
  InvoiceRow,
  RecurrenceType,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nextDueDate(fecha: string, rec: RecurrenceType): string {
  const d = parseISO(fecha);
  const next =
    rec === "monthly"
      ? addMonths(d, 1)
      : rec === "quarterly"
        ? addQuarters(d, 1)
        : addYears(d, 1);
  return format(next, "yyyy-MM-dd");
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Plantillas: facturas recurrentes con next_due_date <= hoy
  const { data: templates, error } = await supabase
    .from("invoices")
    .select("*")
    .neq("recurrence", "unique")
    .lte("next_due_date", today)
    .not("next_due_date", "is", null);

  if (error) {
    console.error("[cron/recurrencias] fetch templates", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const generated: { number: string; total: number; issuer: string }[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const tpl of (templates ?? []) as InvoiceRow[]) {
    if (tpl.recurrence === "unique" || !tpl.next_due_date) {
      skipped.push({ id: tpl.id, reason: "not-recurring" });
      continue;
    }

    // 2. Líneas de la plantilla
    const { data: lines, error: linesErr } = await supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", tpl.id)
      .order("orden");
    if (linesErr) {
      console.error("[cron/recurrencias] fetch lines", linesErr);
      skipped.push({ id: tpl.id, reason: linesErr.message });
      continue;
    }

    const newDueDate = tpl.next_due_date;
    const newYear = parseISO(newDueDate).getFullYear();

    // 3. Insertar nueva instancia (recurrence='unique' para que no se vuelva
    //    a disparar; recurrence_parent_id apunta al template original).
    const { data: newInvoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        issuer_id: tpl.issuer_id,
        year: newYear,
        direction: tpl.direction,
        kind: tpl.kind,
        client_id: tpl.client_id,
        counterparty_user_id: tpl.counterparty_user_id,
        base_imponible: tpl.base_imponible,
        iva_pct: tpl.iva_pct,
        iva_amount: tpl.iva_amount,
        irpf_pct: tpl.irpf_pct,
        irpf_amount: tpl.irpf_amount,
        total: tpl.total,
        fecha_emision: today,
        fecha_vencimiento: newDueDate,
        recurrence: "unique",
        recurrence_parent_id: tpl.recurrence_parent_id ?? tpl.id,
        next_due_date: null,
        status: "sent",
        concepto: tpl.concepto,
        notas: tpl.notas,
        scope: tpl.scope,
      })
      .select()
      .single();

    if (insertError || !newInvoice) {
      console.error("[cron/recurrencias] insert", insertError);
      skipped.push({ id: tpl.id, reason: insertError?.message ?? "insert" });
      continue;
    }

    // 4. Copiar líneas
    if (lines && lines.length > 0) {
      const linesPayload = (lines as InvoiceLineRow[]).map((l) => ({
        invoice_id: newInvoice.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        total: l.total,
        orden: l.orden,
      }));
      const { error: copyError } = await supabase
        .from("invoice_lines")
        .insert(linesPayload);
      if (copyError) {
        console.error("[cron/recurrencias] copy lines", copyError);
        // Rollback: eliminar la nueva factura para no dejar huérfana
        await supabase.from("invoices").delete().eq("id", newInvoice.id);
        skipped.push({ id: tpl.id, reason: copyError.message });
        continue;
      }
    }

    // 5. Actualizar next_due_date del template para el siguiente periodo
    const newNextDue = nextDueDate(newDueDate, tpl.recurrence);
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ next_due_date: newNextDue })
      .eq("id", tpl.id);
    if (updateError) {
      console.error("[cron/recurrencias] update template", updateError);
    }

    generated.push({
      number: newInvoice.invoice_number,
      total: Number(newInvoice.total),
      issuer: tpl.issuer_id,
    });

    // 6. Notificar al emisor por Telegram
    const { data: issuer } = await supabase
      .from("users")
      .select("telegram_chat_id, nombre")
      .eq("id", tpl.issuer_id)
      .maybeSingle();

    if (issuer?.telegram_chat_id) {
      await sendTelegram(
        issuer.telegram_chat_id,
        [
          "📄 *Nueva factura recurrente generada*",
          ``,
          `Número: \`${newInvoice.invoice_number}\``,
          `Total: ${fmtMoneyTelegram(Number(newInvoice.total))}`,
          `Vencimiento: ${newDueDate}`,
        ].join("\n")
      );
    }
  }

  return NextResponse.json({
    ok: true,
    today,
    candidates: templates?.length ?? 0,
    generated: generated.length,
    skipped: skipped.length,
    detail: { generated, skipped },
  });
}

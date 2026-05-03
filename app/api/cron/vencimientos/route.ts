import { format } from "date-fns";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { fmtMoneyTelegram, sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OverdueRow = {
  id: string;
  invoice_number: string;
  total: number;
  issuer_id: string;
  fecha_vencimiento: string;
  client: { nombre: string | null } | null;
};

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Pasar a 'overdue' las facturas enviadas cuyo vencimiento ya pasó
  const { data: overdue, error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("status", "sent")
    .lt("fecha_vencimiento", today)
    .select(
      "id, invoice_number, total, issuer_id, fecha_vencimiento, client:clients(nombre)"
    );

  if (error) {
    console.error("[cron/vencimientos]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (overdue ?? []) as unknown as OverdueRow[];

  // 2. Notificar a cada emisor con un resumen de sus vencidas (de hoy)
  if (list.length > 0) {
    const byIssuer = new Map<string, OverdueRow[]>();
    for (const inv of list) {
      const arr = byIssuer.get(inv.issuer_id) ?? [];
      arr.push(inv);
      byIssuer.set(inv.issuer_id, arr);
    }

    for (const [issuerId, invs] of byIssuer.entries()) {
      const { data: issuer } = await supabase
        .from("users")
        .select("telegram_chat_id, nombre")
        .eq("id", issuerId)
        .maybeSingle();

      if (issuer?.telegram_chat_id) {
        const lines = invs.map(
          (i) =>
            `• \`${i.invoice_number}\` — ${fmtMoneyTelegram(Number(i.total))} (${i.client?.nombre ?? "—"})`
        );
        await sendTelegram(
          issuer.telegram_chat_id,
          [
            "⚠️ *Facturas marcadas como vencidas*",
            "",
            ...lines,
            "",
            "_Marca como cobrada cuando recibas el pago._",
          ].join("\n")
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    today,
    marked_overdue: list.length,
    invoices: list.map((i) => i.invoice_number),
  });
}

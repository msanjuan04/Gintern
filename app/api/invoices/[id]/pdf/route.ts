import { createElement, type ReactElement } from "react";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";

import { InvoicePDF } from "@/components/invoice/InvoicePDF";
import { getInvoice } from "@/lib/invoices/queries";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const invoice = await getInvoice(params.id);
  if (!invoice) {
    return NextResponse.json(
      { error: "Factura no encontrada" },
      { status: 404 }
    );
  }

  if (!invoice.issuer) {
    return NextResponse.json(
      { error: "La factura no tiene emisor cargado" },
      { status: 500 }
    );
  }

  // Solo se generan PDFs de facturas emitidas (cliente o compensación interna).
  if (invoice.direction !== "issued") {
    return NextResponse.json(
      { error: "No se generan PDFs de facturas recibidas" },
      { status: 400 }
    );
  }

  let recipient = invoice.client ?? invoice.counterparty;
  let recipientLabel = "Facturar a";
  if (invoice.kind === "internal_compensation") {
    recipient = invoice.counterparty;
    recipientLabel = "Socio receptor";
  }

  if (!recipient) {
    return NextResponse.json(
      { error: "La factura no tiene receptor (cliente o socio)" },
      { status: 400 }
    );
  }

  // Render PDF
  const element = createElement(InvoicePDF, {
    invoice,
    lines: invoice.lines,
    issuer: invoice.issuer,
    recipient,
    recipientLabel,
  }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  // Subir/actualizar copia en Storage para tener un histórico accesible
  try {
    const filename = `${invoice.invoice_number.replace("/", "-")}.pdf`;
    const path = `${invoice.issuer_id}/${invoice.year}/${filename}`;
    await supabase.storage
      .from("invoices")
      .upload(path, buffer, {
        upsert: true,
        contentType: "application/pdf",
      });
    if (invoice.pdf_storage_path !== path) {
      await supabase
        .from("invoices")
        .update({ pdf_storage_path: path })
        .eq("id", invoice.id);
    }
  } catch (err) {
    // Si falla Storage, no abortamos: aún devolvemos el PDF al usuario.
    console.error("[pdf] Storage upload error:", err);
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const filename = `${invoice.invoice_number.replace("/", "-")}.pdf`;

  // Envolvemos en Blob para satisfacer el tipo BodyInit de NextResponse.
  const body = new Blob([buffer as unknown as BlobPart], {
    type: "application/pdf",
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

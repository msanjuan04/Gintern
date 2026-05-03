import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, Eye, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  KIND_LABELS,
  RECURRENCE_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
} from "@/lib/invoices/labels";
import { getInvoice } from "@/lib/invoices/queries";
import { fmtMoney, formatDate } from "@/lib/utils";

import { InvoiceActionsBar } from "./actions-bar";

export const metadata = {
  title: "Factura · GNERAI Finance",
};

export default async function FacturaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/facturas"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Facturas
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                <FileText className="h-5 w-5" />
              </span>
              <h1 className="font-mono text-2xl font-semibold tracking-tight">
                {invoice.invoice_number}
              </h1>
              <Badge variant={STATUS_BADGE[invoice.status]}>
                {STATUS_LABELS[invoice.status]}
              </Badge>
              <Badge variant="muted">{KIND_LABELS[invoice.kind]}</Badge>
              {invoice.scope === "personal" && (
                <Badge variant="outline">Personal</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoice.concepto}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {invoice.direction === "issued" && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/api/invoices/${invoice.id}/pdf?inline=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver PDF
                  </a>
                </Button>
                <Button asChild variant="brand" size="sm">
                  <a
                    href={`/api/invoices/${invoice.id}/pdf`}
                    download={`${invoice.invoice_number.replace("/", "-")}.pdf`}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </a>
                </Button>
              </div>
            )}
            <InvoiceActionsBar id={invoice.id} status={invoice.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PartyCard
          title="Emisor"
          name={
            invoice.issuer
              ? `${invoice.issuer.nombre} ${invoice.issuer.apellidos ?? ""}`.trim()
              : "—"
          }
          nif={invoice.issuer?.nif ?? null}
          email={invoice.issuer?.email ?? null}
          extra={invoice.issuer?.direccion ?? null}
        />
        <PartyCard
          title={
            invoice.kind === "client"
              ? "Cliente"
              : invoice.kind === "internal_compensation"
                ? "Socio receptor"
                : "Proveedor"
          }
          name={
            invoice.client?.nombre ??
            (invoice.counterparty
              ? `${invoice.counterparty.nombre} ${invoice.counterparty.apellidos ?? ""}`.trim()
              : "—")
          }
          nif={invoice.client?.nif ?? invoice.counterparty?.nif ?? null}
          email={invoice.client?.email ?? invoice.counterparty?.email ?? null}
          extra={
            invoice.client?.direccion ?? invoice.counterparty?.direccion ?? null
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Emisión" value={formatDate(invoice.fecha_emision)} />
            <Row
              label="Vencimiento"
              value={formatDate(invoice.fecha_vencimiento)}
            />
            <Row
              label="Cobro"
              value={
                invoice.fecha_cobro ? formatDate(invoice.fecha_cobro) : "—"
              }
            />
            <Row
              label="Recurrencia"
              value={RECURRENCE_LABELS[invoice.recurrence]}
            />
            {invoice.next_due_date && (
              <Row
                label="Próximo"
                value={formatDate(invoice.next_due_date)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Líneas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Descripción
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cant.
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Precio
                </th>
                <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-6 py-3">{line.descripcion}</td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {line.cantidad}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {fmtMoney(line.precio_unitario)}
                  </td>
                  <td className="px-6 py-3 text-right font-medium tabular-nums">
                    {fmtMoney(line.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-col items-end">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-2 p-5 text-sm">
            <Row
              label="Base imponible"
              value={fmtMoney(invoice.base_imponible)}
            />
            <Row
              label={`IVA ${invoice.iva_pct}%`}
              value={fmtMoney(invoice.iva_amount)}
            />
            <Row
              label={`IRPF -${invoice.irpf_pct}%`}
              value={`-${fmtMoney(invoice.irpf_amount)}`}
            />
            <div className="border-t border-border pt-2" />
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-semibold tabular-nums">
                {fmtMoney(invoice.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas internas</CardTitle>
            <CardDescription>No aparecen en el PDF.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{invoice.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PartyCard({
  title,
  name,
  nif,
  email,
  extra,
}: {
  title: string;
  name: string;
  nif: string | null;
  email: string | null;
  extra: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="font-medium">{name || "—"}</p>
        {nif && <p className="text-xs font-mono text-muted-foreground">{nif}</p>}
        {email && <p className="text-xs text-muted-foreground">{email}</p>}
        {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

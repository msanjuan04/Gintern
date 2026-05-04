import Link from "next/link";
import { FileText, Plus } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  KIND_LABELS,
  STATUS_BADGE,
  STATUS_LABELS,
} from "@/lib/invoices/labels";
import { listInvoices } from "@/lib/invoices/queries";
import type { InvoiceStatus } from "@/types/database";
import { fmtMoney, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Facturas · GNERAI Finance",
};

const STATUS_TABS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "draft", label: "Borrador" },
  { key: "sent", label: "Enviadas" },
  { key: "paid", label: "Cobradas" },
  { key: "overdue", label: "Vencidas" },
];

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; scope?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const statusFilter =
    STATUS_TABS.find((t) => t.key === resolvedSearchParams.status)?.key ?? "all";
  const scope =
    resolvedSearchParams.scope === "personal" ? "personal" : undefined;

  const invoices = await listInvoices({
    status: statusFilter !== "all" ? (statusFilter as InvoiceStatus) : undefined,
    scope,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Facturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Emitidas y recibidas. Numeración correlativa por emisor.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/facturas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Link>
        </Button>
      </div>

      {/* Tabs de estado */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.key;
          const href =
            tab.key === "all"
              ? "/facturas"
              : `/facturas?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft"
                  : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              }
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="mx-2 h-4 w-px bg-border" />
        <Link
          href="/facturas"
          className={
            !scope
              ? "rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground"
              : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          }
        >
          GNERAI
        </Link>
        <Link
          href="/facturas?scope=personal"
          className={
            scope === "personal"
              ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          }
        >
          Personales
        </Link>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
              <FileText className="h-6 w-6 text-brand" />
            </div>
            <CardTitle className="text-lg">No hay facturas</CardTitle>
            <CardDescription>
              Crea tu primera factura. La numeración (MS-2026/001…) se
              generará automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button asChild variant="brand">
              <Link href="/facturas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Crear factura
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente / Concepto</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/facturas/${inv.id}`}
                      className="hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">{KIND_LABELS[inv.kind]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {inv.client?.nombre ?? inv.concepto}
                    </div>
                    {inv.client?.nombre && (
                      <div className="text-xs text-muted-foreground">
                        {inv.concepto}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(inv.fecha_emision)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(inv.fecha_vencimiento)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtMoney(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[inv.status]}>
                      {STATUS_LABELS[inv.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

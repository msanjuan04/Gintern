import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Wallet,
} from "lucide-react";

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
  getClient,
  getClientStats,
  listClientInvoices,
  type PuntualidadEstado,
} from "@/lib/clients/queries";
import { updateClientAction } from "@/lib/clients/actions";
import {
  STATUS_BADGE,
  STATUS_LABELS,
} from "@/lib/invoices/labels";
import { fmtMoney, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/database";

import { ClientForm } from "../client-form";
import { ArchiveButton } from "./archive-button";

export const metadata = {
  title: "Cliente · GNERAI Finance",
};

const PUNTUALIDAD_META: Record<
  PuntualidadEstado,
  {
    label: string;
    badge: "success" | "warning" | "destructive" | "muted";
    descripcion: (dias: number | null) => string;
  }
> = {
  verde: {
    label: "Paga rápido",
    badge: "success",
    descripcion: (d) => `Cobra de media en ${d} días.`,
  },
  ambar: {
    label: "A tiempo",
    badge: "warning",
    descripcion: (d) => `Cobra de media en ${d} días.`,
  },
  rojo: {
    label: "Tarda en pagar",
    badge: "destructive",
    descripcion: (d) => `Cobra de media en ${d} días — vigílalo.`,
  },
  "sin-datos": {
    label: "Sin datos",
    badge: "muted",
    descripcion: () => "Aún no hay facturas cobradas.",
  },
};

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  if (!client) notFound();

  const [stats, invoices] = await Promise.all([
    getClientStats(client.id),
    listClientInvoices(client.id),
  ]);

  const updateAction = updateClientAction.bind(null, client.id);
  const initial = (client.nombre || "?").trim().charAt(0).toUpperCase();
  const punt = PUNTUALIDAD_META[stats.puntualidad];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Clientes
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand">
              {initial}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {client.nombre}
                </h1>
                {client.activo ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="muted">Archivado</Badge>
                )}
                <Badge variant={punt.badge}>{punt.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {client.nif ? `NIF ${client.nif} · ` : ""}Alta {formatDate(client.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArchiveButton id={client.id} activo={client.activo} />
            <Button asChild variant="brand">
              <Link href={`/facturas/nueva?cliente=${client.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva factura
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total facturado"
          value={fmtMoney(stats.total_facturado)}
          hint={`${stats.count_facturas} facturas`}
          icon={<FileText className="h-4 w-4" />}
          tone="brand"
        />
        <KpiCard
          label="Cobrado"
          value={fmtMoney(stats.total_cobrado)}
          hint={`${stats.count_paid} pagadas`}
          icon={<Wallet className="h-4 w-4" />}
          tone="muted"
        />
        <KpiCard
          label="Pendiente"
          value={fmtMoney(stats.pendiente)}
          hint="Enviadas y vencidas"
          icon={<Clock className="h-4 w-4" />}
          tone="muted"
        />
        <KpiCard
          label="Ticket medio"
          value={fmtMoney(stats.ticket_medio)}
          hint={
            stats.dias_promedio_cobro != null
              ? `${stats.dias_promedio_cobro} días en cobrar`
              : "Sin cobros aún"
          }
          icon={<ChevronRight className="h-4 w-4" />}
          tone="muted"
        />
      </div>

      {/* Hints */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-secondary/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Puntualidad
            </p>
            <p className="mt-2 text-sm">
              {punt.descripcion(stats.dias_promedio_cobro)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Próximo vencimiento
            </p>
            <p className="mt-2 text-sm">
              {stats.proximo_vencimiento ? (
                <>
                  Toca cobrar el{" "}
                  <strong>{formatDate(stats.proximo_vencimiento)}</strong>.
                </>
              ) : stats.ultimo_cobro ? (
                <>
                  Sin pagos pendientes. Último cobro:{" "}
                  <strong>{formatDate(stats.ultimo_cobro)}</strong>.
                </>
              ) : (
                "Aún no hay facturas pendientes."
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Histórico de facturas</CardTitle>
            <CardDescription>
              Todas las facturas asociadas a este cliente.
            </CardDescription>
          </div>
          {invoices.length > 0 && (
            <Button asChild variant="link" size="sm">
              <Link href={`/facturas`}>Ver listado completo</Link>
            </Button>
          )}
        </CardHeader>
        {invoices.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay facturas para este cliente.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Cobro</TableHead>
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
                  <TableCell className="text-sm">
                    {formatDate(inv.fecha_emision)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(inv.fecha_vencimiento)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inv.fecha_cobro ? (
                      formatDate(inv.fecha_cobro)
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtMoney(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[inv.status as InvoiceStatus]}>
                      {STATUS_LABELS[inv.status as InvoiceStatus]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edición */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del cliente</CardTitle>
          <CardDescription>
            Cambios disponibles inmediatamente para nuevas facturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            action={updateAction}
            client={client}
            submitLabel="Guardar cambios"
            successMessage="Cambios guardados."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "brand" | "muted";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className={
              tone === "brand"
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand"
                : "flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground"
            }
          >
            {icon}
          </span>
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

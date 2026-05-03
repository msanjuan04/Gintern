import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Receipt,
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
import { listMovements } from "@/lib/movements/queries";
import type { MovementType, Scope } from "@/types/database";
import { fmtMoney, formatDate } from "@/lib/utils";

import { MovementRowActions } from "./row-actions";

export const metadata = {
  title: "Movimientos · GNERAI Finance",
};

type SearchParams = {
  scope?: string;
  tipo?: string;
};

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const scope: Scope | undefined =
    searchParams.scope === "personal"
      ? "personal"
      : searchParams.scope === "gnerai"
        ? "gnerai"
        : undefined;
  const tipo: MovementType | undefined =
    searchParams.tipo === "income"
      ? "income"
      : searchParams.tipo === "expense"
        ? "expense"
        : undefined;

  const movements = await listMovements({ scope, tipo });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Movimientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresos y gastos. Los marcados como GNERAI alimentan el balance.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/movimientos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter href="/movimientos" active={!scope && !tipo} label="Todos" />
        <Filter href="/movimientos?scope=gnerai" active={scope === "gnerai"} label="GNERAI" brand />
        <Filter href="/movimientos?scope=personal" active={scope === "personal"} label="Personales" />
        <span className="mx-2 h-4 w-px bg-border" />
        <Filter href="/movimientos?tipo=income" active={tipo === "income"} label="Ingresos" />
        <Filter href="/movimientos?tipo=expense" active={tipo === "expense"} label="Gastos" />
      </div>

      {movements.length === 0 ? (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
              <Receipt className="h-6 w-6 text-brand" />
            </div>
            <CardTitle className="text-lg">No hay movimientos</CardTitle>
            <CardDescription>
              Registra un ingreso o un gasto para empezar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button asChild variant="brand">
              <Link href="/movimientos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo movimiento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Ámbito</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.tipo === "income" ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(m.fecha)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{m.concepto}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.client?.nombre ?? null}
                      {m.invoice?.invoice_number ? (
                        <Link
                          href={`/facturas/${m.invoice.id}`}
                          className="font-mono hover:underline"
                        >
                          {m.invoice.invoice_number}
                        </Link>
                      ) : null}
                      {!m.client && !m.invoice && (
                        <span className="text-muted-foreground/60">Manual</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.scope === "gnerai" ? (
                      <Badge variant="success">GNERAI</Badge>
                    ) : (
                      <Badge variant="muted">Personal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtMoney(m.base_imponible)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtMoney(m.total)}
                  </TableCell>
                  <TableCell>
                    {m.cobrado ? (
                      <Badge variant="success">
                        {m.tipo === "income" ? "Cobrado" : "Pagado"}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <MovementRowActions
                      id={m.id}
                      tipo={m.tipo}
                      cobrado={m.cobrado}
                      hasInvoice={!!m.invoice_id}
                    />
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

function Filter({
  href,
  active,
  label,
  brand,
}: {
  href: string;
  active: boolean;
  label: string;
  brand?: boolean;
}) {
  if (active) {
    return (
      <Link
        href={href}
        className={
          brand
            ? "rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground"
            : "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-soft"
        }
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {label}
    </Link>
  );
}

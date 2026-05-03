import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

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
  currentQuarter,
  getBalanceActual,
  getCompensacionEntreSocios,
  type BalanceEstado,
} from "@/lib/balance";
import { listMovements } from "@/lib/movements/queries";
import { createClient } from "@/lib/supabase/server";
import { fmtMoney, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Balance · GNERAI Finance",
};

const SEMAFORO: Record<
  BalanceEstado,
  { label: string; chip: "success" | "warning" | "destructive" }
> = {
  verde: { label: "Cuadrados", chip: "success" },
  ambar: { label: "Pequeño desfase", chip: "warning" },
  rojo: { label: "Hay que compensar", chip: "destructive" },
};

const QUARTERS = [1, 2, 3, 4] as const;

export default async function BalancePage({
  searchParams,
}: {
  searchParams: { y?: string; q?: string };
}) {
  const cur = currentQuarter();
  const year = Number(searchParams.y) || cur.year;
  const quarter =
    QUARTERS.find((q) => q === Number(searchParams.q)) ?? cur.quarter;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [balances, movs] = await Promise.all([
    getBalanceActual(year, quarter),
    listMovements({ scope: "gnerai", year, quarter }),
  ]);

  const compensacion = getCompensacionEntreSocios(balances);
  const estado: BalanceEstado =
    balances.find((b) => b.user_id === user?.id)?.estado ?? "verde";
  const semaforo = SEMAFORO[estado];

  // Agrupar movimientos por usuario
  const byUser = new Map<
    string,
    { nombre: string; ingresos: number; gastos: number }
  >();
  for (const b of balances) {
    byUser.set(b.user_id, {
      nombre: b.user_nombre,
      ingresos: 0,
      gastos: 0,
    });
  }
  for (const m of movs) {
    const entry = byUser.get(m.user_id);
    if (!entry) continue;
    if (m.tipo === "income") entry.ingresos += Number(m.base_imponible);
    else entry.gastos += Number(m.base_imponible);
  }

  // Range de años para selector: actual y dos anteriores
  const years = [cur.year, cur.year - 1, cur.year - 2];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Balance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reparto entre socios — solo movimientos GNERAI.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          {years.map((y) =>
            QUARTERS.map((q) => {
              const isCur = year === y && quarter === q;
              return (
                <Link
                  key={`${y}-${q}`}
                  href={`/balance?y=${y}&q=${q}`}
                  className={
                    isCur
                      ? "rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-sm px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }
                >
                  Q{q} {String(y).slice(2)}
                </Link>
              );
            })
          ).flat()}
        </div>
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Q{quarter} {year}
              </CardTitle>
              <CardDescription>
                Diferencia entre las aportaciones netas de los dos socios.
              </CardDescription>
            </div>
            <Badge variant={semaforo.chip}>{semaforo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {balances.map((b) => {
              const entry = byUser.get(b.user_id);
              return (
                <div
                  key={b.user_id}
                  className="rounded-md border border-border/60 bg-secondary/30 p-5"
                >
                  <p className="text-xs text-muted-foreground">
                    {b.user_id === user?.id ? "Tú" : "Otro socio"}
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {b.user_nombre}
                  </p>
                  <p className="mt-4 text-3xl font-semibold tabular-nums">
                    {fmtMoney(b.aportacion_neta)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aportación neta del trimestre
                  </p>
                  {entry && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="tabular-nums">
                          {fmtMoney(entry.ingresos)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-700">
                        <ArrowDownRight className="h-3 w-3" />
                        <span className="tabular-nums">
                          {fmtMoney(entry.gastos)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {compensacion ? (
            <div className="mt-6 rounded-md border border-dashed border-border bg-secondary/40 p-5">
              <p className="text-sm font-medium">Compensación sugerida</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {compensacion.emisor.user_nombre} debería emitir una factura
                interna a {compensacion.receptor.user_nombre} por{" "}
                <strong className="tabular-nums text-foreground">
                  {fmtMoney(compensacion.importe)}
                </strong>{" "}
                (base imponible). Con IVA 21% y IRPF 15% el total quedaría en{" "}
                <strong className="tabular-nums text-foreground">
                  {fmtMoney(
                    Number(
                      (
                        compensacion.importe *
                        1.06 // 1 + 0.21 - 0.15
                      ).toFixed(2)
                    )
                  )}
                </strong>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {compensacion.emisor.user_id === user?.id ? (
                  <Button asChild variant="brand" size="sm">
                    <Link
                      href={`/facturas/nueva?kind=internal_compensation&counterparty=${compensacion.receptor.user_id}&base=${compensacion.importe.toFixed(2)}&concepto=${encodeURIComponent(`Compensación interna Q${quarter} ${year}`)}`}
                    >
                      Crear factura de compensación
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Te toca esperar a que{" "}
                    {compensacion.emisor.user_nombre.split(" ")[0]} la emita.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-dashed border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
              No hay desfase. Las aportaciones están igualadas.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimientos del trimestre */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Movimientos GNERAI · Q{quarter} {year}</CardTitle>
          <CardDescription>
            Desglose completo de los dos socios para este trimestre.
          </CardDescription>
        </CardHeader>
        {movs.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay movimientos GNERAI en este trimestre.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Quién</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">
                    {formatDate(m.fecha)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.user?.nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{m.concepto}</div>
                    {m.invoice?.invoice_number && (
                      <div className="font-mono text-xs text-muted-foreground">
                        {m.invoice.invoice_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtMoney(m.base_imponible)}
                  </TableCell>
                  <TableCell>
                    {m.tipo === "income" ? (
                      <Badge variant="success">Ingreso</Badge>
                    ) : (
                      <Badge variant="muted">Gasto</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

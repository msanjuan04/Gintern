"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadMovementAttachmentAction } from "@/lib/finanzas/actions";
import type { FinanceDashboardData, FinanceTableRow } from "@/lib/finanzas/queries";
import { fmtMoney } from "@/lib/utils";

const DONUT_COLORS: Record<string, string> = {
  saas: "#22c55e",
  estructural: "#f59e0b",
  variable: "#6366f1",
};

export function FinanzasTabs({ data }: { data: FinanceDashboardData }) {
  const [isPending, startTransition] = useTransition();
  const [incomeQuery, setIncomeQuery] = useState("");
  const [incomeStatus, setIncomeStatus] = useState<"all" | "paid" | "pending">("all");
  const [expenseQuery, setExpenseQuery] = useState("");

  const filteredIncomes = useMemo(() => {
    return data.incomes.rows.filter((row) => {
      if (incomeStatus === "paid" && !row.paid) return false;
      if (incomeStatus === "pending" && row.paid) return false;
      if (!incomeQuery.trim()) return true;
      const hay = `${row.concept} ${row.clientName ?? ""}`.toLowerCase();
      return hay.includes(incomeQuery.toLowerCase());
    });
  }, [data.incomes.rows, incomeQuery, incomeStatus]);

  const filteredExpenses = useMemo(() => {
    return data.expenses.rows.filter((row) => {
      if (!expenseQuery.trim()) return true;
      const hay = `${row.concept} ${row.clientName ?? ""}`.toLowerCase();
      return hay.includes(expenseQuery.toLowerCase());
    });
  }, [data.expenses.rows, expenseQuery]);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Resumen y Previsión</TabsTrigger>
        <TabsTrigger value="incomes">Ingresos y Deuda</TabsTrigger>
        <TabsTrigger value="expenses">Control de Gastos</TabsTrigger>
        <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
        <TabsTrigger value="splitter">Splitter</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Beneficio Neto YTD" value={fmtMoney(data.overview.netProfitYtd)} />
            <KpiCard label="Cashflow Actual" value={fmtMoney(data.overview.cashflow)} />
            <KpiCard label="Deuda Pendiente" value={fmtMoney(data.overview.pendingDebt)} />
            <KpiCard label="MRR Asegurado" value={fmtMoney(data.overview.mrrAssured)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingresos vs Gastos (desde diciembre)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.overview.monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => fmtMoney(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Previsión a 3 meses</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {data.overview.forecast.map((item) => (
                <article key={item.month} className="rounded-md border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">{item.month}</p>
                  <p className="mt-1 text-xl font-semibold">{fmtMoney(item.expectedCash)}</p>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="incomes">
        <div className="space-y-6">
          <Card className="border-amber-300/50 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-lg">Aging report de deuda</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.incomes.aging.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay deuda pendiente.</p>
              ) : (
                data.incomes.aging.map((item) => (
                  <article key={item.id} className="rounded-md border border-amber-200 bg-white p-3">
                    <p className="truncate text-sm font-medium">{item.clientName}</p>
                    <p className="text-xs text-muted-foreground">Pendiente hace {item.days} días</p>
                    <p className="mt-1 text-sm font-semibold">{fmtMoney(item.amountNet)}</p>
                  </article>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabla de ingresos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <Input
                  value={incomeQuery}
                  onChange={(event) => setIncomeQuery(event.target.value)}
                  placeholder="Buscar por cliente o concepto..."
                />
                <select
                  value={incomeStatus}
                  onChange={(event) =>
                    setIncomeStatus(event.target.value as "all" | "paid" | "pending")
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagados</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>
              <FinanceRowsTable
                rows={filteredIncomes}
                showStatus
                isPending={isPending}
                onUpload={(movementId, formData) => {
                  startTransition(async () => {
                    await uploadMovementAttachmentAction(movementId, formData);
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="expenses">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Burn Rate Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold">{fmtMoney(data.expenses.burnRate)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Promedio mensual de gasto neto sobre histórico.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gasto por categoría</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expenses.categorySeries}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={86}
                      label={(item) => `${item.category}`}
                    >
                      {data.expenses.categorySeries.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={DONUT_COLORS[entry.category] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmtMoney(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabla de gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={expenseQuery}
                onChange={(event) => setExpenseQuery(event.target.value)}
                placeholder="Buscar gasto por concepto o cliente..."
              />
              <FinanceRowsTable
                rows={filteredExpenses}
                showStatus={false}
                isPending={isPending}
                onUpload={(movementId, formData) => {
                  startTransition(async () => {
                    await uploadMovementAttachmentAction(movementId, formData);
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              label="Rentabilidad promedio por proyecto"
              value={`${data.analytics.profitabilityAverage.toFixed(2)} €/h`}
            />
            <KpiCard
              label="Mejor cliente"
              value={
                data.analytics.bestClient
                  ? `${data.analytics.bestClient.name} · ${fmtMoney(data.analytics.bestClient.margin)}`
                  : "—"
              }
            />
            <KpiCard
              label="Runway"
              value={`${data.analytics.runwayMonths.toFixed(1)} meses`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crecimiento del margen</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.analytics.marginGrowth}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => fmtMoney(value)} />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ranking de clientes por margen</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <article className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs uppercase text-emerald-700">Mejor cliente</p>
                <p className="mt-1 text-sm font-semibold">
                  {data.analytics.bestClient
                    ? `${data.analytics.bestClient.name} · ${fmtMoney(data.analytics.bestClient.margin)}`
                    : "Sin datos"}
                </p>
              </article>
              <article className="rounded-md border border-rose-200 bg-rose-50/50 p-3">
                <p className="text-xs uppercase text-rose-700">Cliente más débil</p>
                <p className="mt-1 text-sm font-semibold">
                  {data.analytics.worstClient
                    ? `${data.analytics.worstClient.name} · ${fmtMoney(data.analytics.worstClient.margin)}`
                    : "Sin datos"}
                </p>
              </article>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="splitter">
        <div className="relative overflow-hidden rounded-xl border border-border/70">
          <div className="grid gap-4 p-6 md:grid-cols-5">
            {Array.from({ length: data.splitter.partnerCount }).map((_, idx) => (
              <article key={idx} className="rounded-lg border border-border/70 bg-card p-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  S{idx + 1}
                </div>
                <p className="text-sm font-medium">Socio {idx + 1}</p>
                <p className="text-xs text-muted-foreground">{data.splitter.defaultSharePct}% base</p>
              </article>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-[1px]">
            <div className="rounded-xl border border-border/80 bg-card px-5 py-4 text-center shadow-sm">
              <p className="text-sm font-semibold">
                🚀 Calculadora dinámica en construcción - Próximamente
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Diseño listo, lógica avanzada pendiente de integrar.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FinanceRowsTable({
  rows,
  showStatus,
  onUpload,
  isPending,
}: {
  rows: FinanceTableRow[];
  showStatus: boolean;
  onUpload: (movementId: string, formData: FormData) => void;
  isPending: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin registros con esos filtros.</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Emisión</TableHead>
            <TableHead>Cobro</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Impuestos</TableHead>
            {showStatus && <TableHead>Estado</TableHead>}
            <TableHead>Adjunto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const tax = row.amountTotal - row.amountNet;
            return (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id.slice(0, 8)}</TableCell>
                <TableCell className="max-w-[220px] truncate">{row.concept}</TableCell>
                <TableCell>{row.clientName ?? "—"}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.paidDate ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(row.amountNet)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(tax)}</TableCell>
                {showStatus && (
                  <TableCell>
                    <Badge variant={row.paid ? "success" : "warning"}>
                      {row.paid ? "Pagado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  {row.attachmentUrl ? (
                    <a
                      href={row.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                    >
                      Ver
                    </a>
                  ) : (
                    <form
                      action={(formData) => onUpload(row.id, formData)}
                      className="inline-flex items-center"
                    >
                      <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary">
                        {isPending ? "Subiendo..." : "Subir PDF"}
                        <input
                          name="file"
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(event) => {
                            if (event.currentTarget.files?.length) {
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                        />
                      </label>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

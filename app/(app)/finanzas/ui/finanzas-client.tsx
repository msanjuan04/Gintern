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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  duplicateTransactionAction,
  updateTransactionAction,
} from "@/lib/finanzas/_actions/transactions";
import { fmtMoney } from "@/lib/utils";
import type {
  FinanceDataBundle,
  TransactionCategory,
  TransactionRow,
} from "@/lib/finanzas/_services/queries";

import { TransactionModal } from "./transaction-modal";

const CATEGORY_LABEL: Record<string, string> = {
  saas: "SaaS",
  structural: "Estructural",
  variable: "Variable",
  service: "Servicio",
  uncategorized: "Sin clasificar",
  internal_movement: "Interno",
};

function toCsv(rows: TransactionRow[]) {
  const head = ["Fecha", "Concepto", "Categoria", "Base", "Impuestos", "Estado"];
  const body = rows.map((r) => [
    r.issued_at,
    r.concept,
    r.category,
    String(r.amount_net),
    String(r.tax_amount),
    r.paid_at ? "paid" : "pending",
  ]);
  return [head, ...body].map((line) => line.map((x) => `"${x.replaceAll('"', '""')}"`).join(",")).join("\n");
}

function downloadCsv(filename: string, rows: TransactionRow[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filterRows(
  rows: TransactionRow[],
  query: { from: string; to: string; clientId: string }
) {
  return rows.filter((r) => {
    if (query.from && r.issued_at < query.from) return false;
    if (query.to && r.issued_at > query.to) return false;
    if (query.clientId && r.client_id !== query.clientId) return false;
    return true;
  });
}

export function FinanzasClient({
  initialData,
  clients,
}: {
  initialData: FinanceDataBundle;
  clients: Array<{ id: string; nombre: string | null }>;
}) {
  const [incomeFilter, setIncomeFilter] = useState({ from: "", to: "", clientId: "" });
  const [expenseFilter, setExpenseFilter] = useState({ from: "", to: "", clientId: "" });

  const filteredIncomes = useMemo(
    () => filterRows(initialData.incomes, incomeFilter),
    [incomeFilter, initialData.incomes]
  );
  const filteredExpenses = useMemo(
    () => filterRows(initialData.expenses, expenseFilter),
    [expenseFilter, initialData.expenses]
  );
  const totalPartnerHeld = useMemo(
    () =>
      initialData.treasury.partnerBalances.reduce(
        (acc, row) => acc + row.netAmount,
        0
      ),
    [initialData.treasury.partnerBalances]
  );
  const netVsCashDelta = useMemo(
    () => Number((initialData.kpis.netProfit - initialData.treasury.bankCash).toFixed(2)),
    [initialData.kpis.netProfit, initialData.treasury.bankCash]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TransactionModal clients={clients} />
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="h-11 rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="resumen" className="rounded-lg">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos" className="rounded-lg">Ingresos</TabsTrigger>
          <TabsTrigger value="gastos" className="rounded-lg">Gastos</TabsTrigger>
          <TabsTrigger value="socios" className="rounded-lg">Socios</TabsTrigger>
          <TabsTrigger value="reportes" className="rounded-lg">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi title="Beneficio Neto" value={fmtMoney(initialData.kpis.netProfit)} />
            <Kpi title="Ingresos Operativos" value={fmtMoney(initialData.kpis.operationalIncome)} />
            <Kpi title="Gastos Operativos" value={fmtMoney(initialData.kpis.operationalExpense)} />
            <Kpi title="Hucha de IVA" value={fmtMoney(initialData.kpis.vatPiggyBank)} />
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Ingresos vs Gastos por mes</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialData.monthlySeries}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <FinanceTable rows={initialData.latest} title="Ultimos Movimientos" clients={clients} />
        </TabsContent>

        <TabsContent value="ingresos" className="space-y-4">
          <FiltersRow
            filter={incomeFilter}
            setFilter={setIncomeFilter}
            clients={clients}
            onExport={() => downloadCsv("ingresos.csv", filteredIncomes)}
          />
          <FinanceTable rows={filteredIncomes} title="Ingresos" progressive clients={clients} />
        </TabsContent>

        <TabsContent value="gastos" className="space-y-4">
          <FiltersRow
            filter={expenseFilter}
            setFilter={setExpenseFilter}
            clients={clients}
            onExport={() => downloadCsv("gastos.csv", filteredExpenses)}
          />
          <FinanceTable rows={filteredExpenses} title="Gastos" progressive clients={clients} />
        </TabsContent>

        <TabsContent value="socios" className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="rounded-2xl border-emerald-300/60 bg-emerald-50/30 xl:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Caja del Banco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Saldo físico disponible en banco (ingresos totales absolutos menos gastos totales absolutos).
                </p>
                <p className="text-5xl font-semibold tracking-tight tabular-nums text-emerald-700">
                  {fmtMoney(initialData.treasury.bankCash)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="success">Tesorería real</Badge>
                  <Badge variant="outline">Corte actual</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricRow label="Beneficio neto" value={fmtMoney(initialData.kpis.netProfit)} />
                <MetricRow label="Dinero socios" value={fmtMoney(totalPartnerHeld)} />
                <MetricRow
                  label="Brecha neto vs caja"
                  value={fmtMoney(netVsCashDelta)}
                  tone={netVsCashDelta >= 0 ? "text-amber-700" : "text-rose-700"}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Dinero en manos de socios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {initialData.treasury.partnerBalances.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay movimientos de socios para mostrar.</p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {initialData.treasury.partnerBalances.map((partner) => (
                      <div
                        key={partner.partnerName}
                        className="rounded-xl border border-border/70 bg-card p-4"
                      >
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {partner.partnerName}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tabular-nums">
                          {fmtMoney(partner.netAmount)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Neto retirado (retiros - inyecciones)
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total agregado socios
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {fmtMoney(totalPartnerHeld)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Kpi title="Ingreso medio mensual" value={fmtMoney(initialData.reports.kpis.avgMonthlyIncome)} />
            <Kpi title="Gasto medio mensual" value={fmtMoney(initialData.reports.kpis.avgMonthlyExpense)} />
            <Kpi title="Neto medio mensual" value={fmtMoney(initialData.reports.kpis.avgMonthlyNet)} />
            <Kpi title="Volatilidad de gasto" value={`${initialData.reports.kpis.expenseVolatilityPct.toFixed(2)}%`} />
            <Kpi title="Concentración categoría top" value={`${initialData.reports.kpis.topExpenseCategoryPct.toFixed(2)}%`} />
            <Kpi
              title="Peso de movimientos internos"
              value={`${initialData.reports.kpis.internalMovementWeightPct.toFixed(2)}%`}
            />
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Evolución mensual operativa</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={initialData.reports.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="net" name="Neto" stroke="#3b82f6" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Predicción 3 meses (run-rate)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialData.reports.forecast3m}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                  <Legend />
                  <Bar dataKey="expectedIncome" name="Ingreso esperado" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expectedExpense" name="Gasto esperado" fill="#f97316" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expectedNet" name="Neto esperado" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Distribucion de gasto por categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={initialData.categoryExpenseSeries} dataKey="value" nameKey="category" outerRadius={100}>
                    {initialData.categoryExpenseSeries.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={
                          entry.category === "saas"
                            ? "#22c55e"
                            : entry.category === "structural"
                            ? "#f59e0b"
                            : "#6366f1"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Top gastos operativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {initialData.reports.topExpenses.map((row) => (
                <div
                  key={`${row.concept}-${row.issuedAt}-${row.amount}`}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.concept}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.issuedAt} · {CATEGORY_LABEL[row.category] ?? row.category}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{fmtMoney(row.amount)}</p>
                </div>
              ))}
              {initialData.reports.topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay gastos para analizar.</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function FiltersRow({
  filter,
  setFilter,
  clients,
  onExport,
}: {
  filter: { from: string; to: string; clientId: string };
  setFilter: (value: { from: string; to: string; clientId: string }) => void;
  clients: Array<{ id: string; nombre: string | null }>;
  onExport: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-card p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
      <Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
      <Input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
      <select
        value={filter.clientId}
        onChange={(e) => setFilter({ ...filter, clientId: e.target.value })}
        className="h-11 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Todos los clientes</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre ?? "Sin nombre"}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onExport}
        className="h-11 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
      >
        Exportar CSV
      </button>
    </div>
  );
}

function FinanceTable({
  rows,
  title,
  progressive = false,
  clients,
}: {
  rows: TransactionRow[];
  title: string;
  progressive?: boolean;
  clients: Array<{ id: string; nombre: string | null }>;
}) {
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleRows = progressive ? rows.slice(0, visibleCount) : rows;
  const hasMore = progressive && visibleRows.length < rows.length;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Base Imponible</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.issued_at}</TableCell>
                <TableCell>
                  <Badge variant={row.type === "income" ? "success" : "destructive"}>
                    {row.type === "income" ? "Ingreso" : "Gasto"}
                  </Badge>
                </TableCell>
                <TableCell>{row.concept}</TableCell>
                <TableCell>
                  <Badge variant="outline">{CATEGORY_LABEL[row.category] ?? row.category}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(row.amount_net)}</TableCell>
                <TableCell className="text-right">
                  <TransactionRowActions row={row} clients={clients} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {progressive && rows.length > PAGE_SIZE ? (
          <div className="mt-4 flex justify-center gap-2">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
              >
                Ver más
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(PAGE_SIZE)}
                className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
              >
                Ver menos
              </button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TransactionRowActions({
  row,
  clients,
}: {
  row: TransactionRow;
  clients: Array<{ id: string; nombre: string | null }>;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"edit" | "duplicate" | null>(null);
  const [draft, setDraft] = useState({
    concept: row.concept,
    type: row.type,
    category: row.category,
    amountNet: String(row.amount_net),
    taxAmount: String(row.tax_amount),
    amountTotal: String(row.amount_total),
    issuedAt: row.issued_at,
    paidAt: row.paid_at ?? "",
    clientId: row.client_id ?? "",
  });

  const categories =
    draft.type === "income"
      ? [
          { value: "service", label: "Servicio" },
          { value: "uncategorized", label: "Sin clasificar" },
          { value: "internal_movement", label: "Movimiento interno" },
        ]
      : [
          { value: "saas", label: "SaaS" },
          { value: "structural", label: "Estructural" },
          { value: "variable", label: "Variable" },
          { value: "internal_movement", label: "Movimiento interno" },
        ];

  function open(nextMode: "edit" | "duplicate") {
    setDraft({
      concept: row.concept,
      type: row.type,
      category: row.category,
      amountNet: String(row.amount_net),
      taxAmount: String(row.tax_amount),
      amountTotal: String(row.amount_total),
      issuedAt: row.issued_at,
      paidAt: row.paid_at ?? "",
      clientId: row.client_id ?? "",
    });
    setMode(nextMode);
  }

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => open("edit")}>
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={() => open("duplicate")}>
          Duplicar
        </Button>
      </div>
      <Dialog open={mode !== null} onOpenChange={(openState) => !openState && setMode(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Editar movimiento" : "Duplicar movimiento"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData();
              formData.set("concept", draft.concept);
              formData.set("type", draft.type);
              formData.set("category", draft.category);
              formData.set("amountNet", draft.amountNet);
              formData.set("taxAmount", draft.taxAmount);
              formData.set("amountTotal", draft.amountTotal);
              formData.set("issuedAt", draft.issuedAt);
              formData.set("paidAt", draft.paidAt);
              formData.set("clientId", draft.clientId);
              if (mode === "edit") formData.set("transactionId", row.id);

              startTransition(async () => {
                if (mode === "edit") {
                  await updateTransactionAction(formData);
                } else if (mode === "duplicate") {
                  await duplicateTransactionAction(formData);
                }
                setMode(null);
              });
            }}
          >
            <Input
              value={draft.concept}
              onChange={(e) => setDraft((prev) => ({ ...prev, concept: e.target.value }))}
              placeholder="Concepto"
              className="md:col-span-2"
              required
            />
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  type: e.target.value as "income" | "expense",
                  category: e.target.value === "income" ? "service" : "saas",
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  category: e.target.value as TransactionCategory,
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              value={draft.amountNet}
              onChange={(e) => setDraft((prev) => ({ ...prev, amountNet: e.target.value }))}
              placeholder="Base imponible"
              required
            />
            <Input
              type="number"
              step="0.01"
              value={draft.taxAmount}
              onChange={(e) => setDraft((prev) => ({ ...prev, taxAmount: e.target.value }))}
              placeholder="Impuestos"
              required
            />
            <Input
              type="number"
              step="0.01"
              value={draft.amountTotal}
              onChange={(e) => setDraft((prev) => ({ ...prev, amountTotal: e.target.value }))}
              placeholder="Total"
              required
            />
            <Input
              type="date"
              value={draft.issuedAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, issuedAt: e.target.value }))}
              required
            />
            <Input
              type="date"
              value={draft.paidAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, paidAt: e.target.value }))}
            />
            <select
              value={draft.clientId}
              onChange={(e) => setDraft((prev) => ({ ...prev, clientId: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre ?? "Sin nombre"}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMode(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear duplicado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricRow({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}


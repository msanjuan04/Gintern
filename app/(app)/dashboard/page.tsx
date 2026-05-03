import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Receipt,
  Sparkles,
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
  currentQuarter,
  getBalanceActual,
  getCompensacionEntreSocios,
  type BalanceEstado,
} from "@/lib/balance";
import { listUpcoming } from "@/lib/calendar/queries";
import {
  getDashboardKpis,
  getRecentMovements,
} from "@/lib/movements/queries";
import { createClient } from "@/lib/supabase/server";
import { fmtMoney, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Dashboard · GNERAI Finance",
};

const SEMAFORO: Record<
  BalanceEstado,
  {
    label: string;
    accent: string;
    chip: "success" | "warning" | "destructive";
    descripcion: string;
  }
> = {
  verde: {
    label: "Cuadrados",
    accent: "from-emerald-50 via-emerald-50 to-white",
    chip: "success",
    descripcion: "El balance entre los dos socios está dentro del margen.",
  },
  ambar: {
    label: "Pequeño desfase",
    accent: "from-amber-50 via-amber-50 to-white",
    chip: "warning",
    descripcion: "Hay un desfase tolerable. Se acumula al próximo cierre.",
  },
  rojo: {
    label: "Hay que compensar",
    accent: "from-rose-50 via-rose-50 to-white",
    chip: "destructive",
    descripcion:
      "Conviene emitir una factura interna para igualar las bases imponibles.",
  },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nombre = user?.email?.split("@")[0] ?? "socio";

  const { year, quarter } = currentQuarter();
  const trimestre = `Q${quarter} ${year}`;

  const todayIso = new Date().toISOString().slice(0, 10);
  const in30DaysIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  })();

  const [balances, kpis, recent, upcoming] = await Promise.all([
    getBalanceActual(year, quarter),
    user ? getDashboardKpis(user.id, year, quarter) : null,
    getRecentMovements(8),
    listUpcoming(todayIso, in30DaysIso, 6),
  ]);

  const myBalance = balances.find((b) => b.user_id === user?.id);
  const otherBalance = balances.find((b) => b.user_id !== user?.id);
  const compensacion = getCompensacionEntreSocios(balances);
  const estado: BalanceEstado = myBalance?.estado ?? "verde";
  const semaforo = SEMAFORO[estado];
  const delta = compensacion?.importe ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Hola, {nombre}.</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/movimientos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Movimiento
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/facturas/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero balance */}
      <Card
        className={`overflow-hidden border-border/40 bg-gradient-to-br ${semaforo.accent}`}
      >
        <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr,auto] md:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={semaforo.chip}>{trimestre}</Badge>
              <Badge variant={semaforo.chip}>{semaforo.label}</Badge>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Balance entre socios
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              {semaforo.descripcion}
            </p>
            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-4xl font-bold tracking-tight tabular-nums md:text-5xl">
                {fmtMoney(delta)}
              </span>
              <span className="text-sm text-muted-foreground">
                de desfase
              </span>
            </div>
            {compensacion && (
              <p className="text-sm text-muted-foreground">
                {compensacion.emisor.user_id === user?.id
                  ? `Tendrías que emitir una factura interna a ${compensacion.receptor.user_nombre} por ${fmtMoney(compensacion.importe)}.`
                  : `${compensacion.emisor.user_nombre} debería emitirte una factura interna por ${fmtMoney(compensacion.importe)}.`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2">
            <Button asChild variant="brand" size="lg">
              <Link href="/balance">
                <Sparkles className="mr-2 h-4 w-4" />
                Ver balance
              </Link>
            </Button>
            {compensacion &&
              estado === "rojo" &&
              compensacion.emisor.user_id === user?.id && (
                <Button asChild variant="outline">
                  <Link
                    href={`/facturas/nueva?kind=internal_compensation&counterparty=${compensacion.receptor.user_id}&base=${compensacion.importe.toFixed(2)}&concepto=${encodeURIComponent(`Compensación interna Q${quarter} ${year}`)}`}
                  >
                    Generar compensación
                  </Link>
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ArrowUpRight className="h-4 w-4" />}
          label="Tu aportación"
          value={myBalance?.aportacion_neta ?? 0}
          tone="brand"
          hint={trimestre}
        />
        <StatCard
          icon={<ArrowDownRight className="h-4 w-4" />}
          label="Aportación del otro socio"
          value={otherBalance?.aportacion_neta ?? 0}
          tone="muted"
          hint={otherBalance?.user_nombre ?? trimestre}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total trimestre (tú)"
          value={kpis?.totalQ ?? 0}
          tone="muted"
          hint="GNERAI · ingresos"
        />
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label="Pendiente de cobro"
          value={kpis?.pendienteCobro ?? 0}
          tone="muted"
          hint="Tus facturas y movimientos"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>Siguientes 30 días</CardDescription>
          </div>
          <Button asChild variant="link" size="sm">
            <Link href="/calendario">Ver calendario</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm font-medium">
                Aún no hay vencimientos próximos.
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Cuando emitas facturas con vencimiento aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center gap-4 py-3 text-sm"
                >
                  <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                    {formatDate(ev.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/facturas/${ev.invoice_id}`}
                      className="font-medium hover:underline"
                    >
                      {ev.client_name ?? ev.invoice_number}
                    </Link>
                    <div className="font-mono text-xs text-muted-foreground">
                      {ev.invoice_number}
                    </div>
                  </div>
                  <span className="tabular-nums">{fmtMoney(ev.total)}</span>
                  {ev.status === "overdue" ? (
                    <Badge variant="destructive">Vencido</Badge>
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>
              Últimos 8 GNERAI (de los dos socios)
            </CardDescription>
          </div>
          <Button asChild variant="link" size="sm">
            <Link href="/movimientos">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm font-medium">Aún no hay movimientos.</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Registra un ingreso o un gasto para empezar.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/movimientos/nuevo">Nuevo movimiento</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Quién</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">
                      {formatDate(m.fecha)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{m.concepto}</div>
                      {m.invoice?.invoice_number && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {m.invoice.invoice_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.user?.nombre ?? "—"}
                    </TableCell>
                    <TableCell
                      className={
                        m.tipo === "income"
                          ? "text-right font-medium tabular-nums text-emerald-700"
                          : "text-right font-medium tabular-nums text-rose-700"
                      }
                    >
                      {m.tipo === "income" ? "+" : "-"}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "brand" | "muted";
  hint?: string;
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
          {fmtMoney(value)}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Flame,
  KeyRound,
  PiggyBank,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describeActivityLog } from "@/lib/activity-logs/format-log";
import {
  getDashboardData,
  type DashboardAlert,
  type DashboardData,
  type DashboardGoal,
  type FinancialSnapshot,
  type PipelineSnapshot,
} from "@/lib/dashboard/queries";
import { fmtMoney } from "@/lib/utils";

export const metadata = {
  title: "Panel · GNERAI",
};

const ALERT_ICON: Record<DashboardAlert["kind"], typeof Flame> = {
  fires: Flame,
  renewals: RefreshCw,
  rotations: KeyRound,
  expired_proposals: FileText,
};

const STATUS_PILL: Record<string, string> = {
  backlog: "bg-secondary text-secondary-foreground",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  blocked: "bg-destructive/15 text-destructive",
  in_review: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  done: "bg-brand/15 text-brand",
};

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "En progreso",
  blocked: "Bloqueado",
  in_review: "En revisión",
  done: "Terminado",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name: string | null | undefined): string {
  if (!name) return "bg-muted text-muted-foreground";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const palette = [
    "bg-secondary text-foreground/80",
    "bg-brand/15 text-brand",
    "bg-foreground/10 text-foreground/80",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "bg-destructive/15 text-destructive",
    "bg-secondary/70 text-foreground/70",
  ];
  return palette[Math.abs(hash) % palette.length];
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function greeting(name: string): string {
  const hour = new Date().getHours();
  const time =
    hour < 6 ? "Buenas noches" : hour < 13 ? "Buenos días" : hour < 21 ? "Buenas tardes" : "Buenas noches";
  const firstName = name.split(/\s+/)[0];
  return `${time}, ${firstName}`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting(data.currentUser.name)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen operativo y financiero del equipo · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <AlertsBar alerts={data.alerts} />
      <FinancialSection finance={data.finance} />
      <OperationsSection
        pipeline={data.pipeline}
        myTickets={data.myTickets}
        upcoming={data.upcoming}
      />
      <BottomSection goals={data.goals} activity={data.activity} />
    </div>
  );
}

// =============================================================================
// Sección 1 — Cinta de alertas críticas
// =============================================================================

function AlertsBar({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="flex items-center gap-3 py-3">
          <CheckCircle2 className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Todo bajo control
            </p>
            <p className="text-xs text-muted-foreground">
              No hay fuegos, vencimientos ni rotaciones críticas pendientes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
      {alerts.map((alert) => {
        const Icon = ALERT_ICON[alert.kind];
        const isDestructive = alert.tone === "destructive";
        return (
          <Link key={alert.kind} href={alert.href}>
            <Card
              className={`h-full transition-all hover:scale-[1.01] ${
                isDestructive
                  ? "border-destructive/40 bg-destructive/5 hover:border-destructive"
                  : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
              }`}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isDestructive
                      ? "bg-destructive/15 text-destructive"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{alert.label}</p>
                  {alert.hint && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {alert.hint}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// =============================================================================
// Sección 2 — Foco financiero
// =============================================================================

function FinancialSection({ finance }: { finance: FinancialSnapshot }) {
  const monthDelta = finance.monthResult.netProfit - finance.monthResult.avg3m;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Foco financiero
        </h2>
        <Link
          href="/finanzas"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Ver detalle →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceKpi
          label="Caja en banco"
          value={fmtMoney(finance.bankCash)}
          icon={Wallet}
          delta={finance.bankCashDeltaMonth}
          deltaLabel="este mes"
          href="/finanzas"
        />
        <FinanceKpi
          label="Resultado del mes"
          value={fmtMoney(finance.monthResult.netProfit)}
          icon={finance.monthResult.netProfit >= 0 ? TrendingUp : TrendingDown}
          delta={monthDelta}
          deltaLabel="vs media 3m"
          accent={finance.monthResult.netProfit >= 0 ? "success" : "destructive"}
          href="/finanzas"
        />
        <FinanceKpi
          label="Hucha de IVA"
          value={fmtMoney(finance.vatPiggyBank)}
          icon={PiggyBank}
          subtitle="Reservado para Hacienda"
          href="/finanzas"
        />
      </div>

      {finance.monthlySeries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos vs gastos · últimos {finance.monthlySeries.length} meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBars series={finance.monthlySeries} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FinanceKpi({
  label,
  value,
  icon: Icon,
  subtitle,
  delta,
  deltaLabel,
  accent = "neutral",
  href,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  accent?: "neutral" | "success" | "destructive";
  href: string;
}) {
  const valueColor =
    accent === "success"
      ? "text-brand"
      : accent === "destructive"
        ? "text-destructive"
        : "";

  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-brand/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums xl:text-3xl ${valueColor}`}>
            {value}
          </p>
          {(subtitle || (delta !== undefined && deltaLabel)) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {delta !== undefined && deltaLabel && (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium ${
                    delta >= 0 ? "text-brand" : "text-destructive"
                  }`}
                >
                  {delta >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {fmtMoney(Math.abs(delta))}
                </span>
              )}
              {deltaLabel && (
                <span className="text-muted-foreground">{deltaLabel}</span>
              )}
              {subtitle && (
                <span className="text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function MonthlyBars({
  series,
}: {
  series: FinancialSnapshot["monthlySeries"];
}) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((p) => [p.income, p.expense])
  );

  return (
    <div className="flex items-end gap-3 pt-2">
      {series.map((point, idx) => {
        const incomeHeight = (point.income / maxValue) * 100;
        const expenseHeight = (point.expense / maxValue) * 100;
        const net = point.income - point.expense;
        return (
          <div
            key={`${point.month}-${idx}`}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-28 w-full items-end gap-1">
              <div
                className="flex-1 rounded-t bg-brand/70 transition-all hover:bg-brand"
                style={{ height: `${Math.max(2, incomeHeight)}%` }}
                title={`Ingresos: ${fmtMoney(point.income)}`}
              />
              <div
                className="flex-1 rounded-t bg-foreground/70 transition-all hover:bg-foreground"
                style={{ height: `${Math.max(2, expenseHeight)}%` }}
                title={`Gastos: ${fmtMoney(point.expense)}`}
              />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {point.month}
            </p>
            <p
              className={`text-[10px] tabular-nums ${
                net >= 0 ? "text-brand" : "text-destructive"
              }`}
            >
              {net >= 0 ? "+" : "−"}
              {fmtMoney(Math.abs(net)).replace(/\s?€/, "€")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Sección 3 — Operativa: pipeline / mis tickets / próximos 7 días
// =============================================================================

function OperationsSection({
  pipeline,
  myTickets,
  upcoming,
}: {
  pipeline: PipelineSnapshot;
  myTickets: DashboardData["myTickets"];
  upcoming: DashboardData["upcoming"];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Mis tickets prioritarios</CardTitle>
          <Link
            href="/tickets"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {myTickets.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              text="Sin tickets pendientes"
              hint="Buen trabajo, no tienes nada urgente asignado."
            />
          ) : (
            myTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href="/tickets"
                className="block rounded-md border border-border/70 px-3 py-2 transition-colors hover:border-brand/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ticket.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {ticket.code ?? "TK-pendiente"}
                      {ticket.client_name ? ` · ${ticket.client_name}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {ticket.priority === "fire" && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                        Fuego
                      </Badge>
                    )}
                    {ticket.priority === "high" && (
                      <Badge variant="warning" className="h-4 px-1.5 text-[10px]">
                        Alta
                      </Badge>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        STATUS_PILL[ticket.status] ?? STATUS_PILL.backlog
                      }`}
                    >
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                    {ticket.due_date && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {formatShortDate(ticket.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Pipeline comercial</CardTitle>
          <Link
            href="/propuestas"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Propuestas →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <PipelineStat
              label="Abiertas"
              value={String(pipeline.totalOpen)}
            />
            <PipelineStat
              label="Valor"
              value={fmtMoney(pipeline.valueOpen).replace(/\s?€/, "€")}
            />
            <PipelineStat
              label="Win rate"
              value={`${pipeline.winRate}%`}
            />
          </div>
          {pipeline.hotClients.length === 0 ? (
            <EmptyState
              icon={Target}
              text="Sin clientes calientes"
              hint="No hay clientes en propuesta o negociación."
            />
          ) : (
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top clientes calientes
              </p>
              {pipeline.hotClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clientes/${client.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-sm transition-colors hover:border-brand/50"
                >
                  <span className="truncate">{client.nombre}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={
                        client.stage === "negotiation" ? "warning" : "secondary"
                      }
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {client.stage === "negotiation"
                        ? "Negociación"
                        : "Propuesta"}
                    </Badge>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {fmtMoney(client.estimated_ltv ?? 0).replace(/\s?€/, "€")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Próximos 7 días</CardTitle>
          <Link
            href="/calendario"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Calendario →
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              text="Sin eventos próximos"
              hint="Nada en los próximos 7 días."
            />
          ) : (
            upcoming.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href={event.href}
                className="flex items-start justify-between gap-2 rounded-md border border-border/70 px-3 py-2 transition-colors hover:border-brand/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {event.subtitle ?? ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      event.status === "overdue"
                        ? "text-destructive"
                        : event.date === new Date().toISOString().slice(0, 10)
                          ? "text-amber-600 dark:text-amber-400"
                          : ""
                    }`}
                  >
                    {formatShortDate(event.date)}
                  </span>
                  {event.total > 0 && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {fmtMoney(event.total).replace(/\s?€/, "€")}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
  hint,
}: {
  icon: typeof Wallet;
  text: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border/70 px-3 py-6 text-center">
      <Icon className="mb-1.5 h-5 w-5 text-muted-foreground" />
      <p className="text-xs font-medium">{text}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// =============================================================================
// Sección 4 — Objetivos + actividad reciente
// =============================================================================

function BottomSection({
  goals,
  activity,
}: {
  goals: DashboardGoal[];
  activity: DashboardData["activity"];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Objetivos en curso</CardTitle>
          <Link
            href="/organizacion/objetivos"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="space-y-1.5 pb-3">
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              text="Sin objetivos activos"
              hint="Crea uno desde Organización → Objetivos."
            />
          ) : (
            goals.slice(0, 3).map((goal) => {
              const today = new Date().toISOString().slice(0, 10);
              const isOverdue = goal.target_date && goal.target_date < today;
              const isSoon =
                goal.target_date &&
                goal.target_date >= today &&
                (new Date(goal.target_date).getTime() - new Date(today).getTime()) /
                  (24 * 60 * 60 * 1000) <=
                  14;
              const tone = isOverdue
                ? "destructive"
                : isSoon
                  ? "warning"
                  : "default";
              return (
                <div key={goal.id} className="px-1 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-xs font-medium">
                        {goal.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        · {goal.scope === "team" ? "Equipo" : "Personal"}
                        {goal.target_date ? ` · ${formatShortDate(goal.target_date)}` : ""}
                      </span>
                      {tone === "destructive" && (
                        <span className="shrink-0 rounded-full bg-destructive/15 px-1.5 text-[9px] font-medium text-destructive">
                          Vencido
                        </span>
                      )}
                      {tone === "warning" && (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                          Próximo
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {Math.round(goal.progressPercent)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-secondary">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        tone === "destructive"
                          ? "bg-destructive"
                          : tone === "warning"
                            ? "bg-amber-500"
                            : "bg-brand"
                      }`}
                      style={{
                        width: `${Math.max(2, goal.progressPercent)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Actividad reciente</CardTitle>
          <Link
            href="/logs"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Ver todo →
          </Link>
        </CardHeader>
        <CardContent className="pb-3">
          {activity.length === 0 ? (
            <EmptyState icon={AlertTriangle} text="Sin actividad reciente" />
          ) : (
            <div className="space-y-0.5">
              {activity.slice(0, 6).map((log) => {
                const summary = describeActivityLog(log);
                const inner = (
                  <>
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${avatarColor(
                        log.actor_name
                      )}`}
                      title={log.actor_name ?? "Sistema"}
                    >
                      {getInitials(log.actor_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs leading-tight">
                        <span className="font-medium">
                          {log.actor_name ?? "Sistema"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · {summary.headline}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {formatRelative(log.created_at)}
                    </span>
                  </>
                );
                return summary.href ? (
                  <Link
                    key={log.id}
                    href={summary.href}
                    className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/40"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={log.id}
                    className="flex items-center gap-2 rounded-md px-1.5 py-1"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

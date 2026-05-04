import Link from "next/link";
import { AlertTriangle, ArrowRight, Briefcase, CalendarClock, Flame, ReceiptText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/utils";
import { getDashboardBlocks, getDashboardFocusData } from "@/lib/dashboard/queries";

export const metadata = {
  title: "Panel · GNERAI",
};

type SearchParams = { view?: "personal" | "global" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentView =
    resolvedSearchParams.view === "global" ? "global" : "personal";
  const [blocks, focusData] = await Promise.all([
    getDashboardBlocks(currentView),
    getDashboardFocusData(),
  ]);
  const blockByKey = new Map(blocks.map((block) => [block.key, block]));
  const fires = blockByKey.get("fires")?.value ?? 0;
  const deadlines = blockByKey.get("deadlines")?.value ?? 0;
  const deviations = blockByKey.get("deviations")?.value ?? 0;
  const healthScore = Math.max(0, 100 - fires * 8 - deadlines * 4 - deviations * 6);
  const healthLabel =
    healthScore >= 80 ? "Salud alta" : healthScore >= 55 ? "Salud media" : "Riesgo alto";

  const topPriorities = [
    {
      id: "fires",
      label: "Fuegos activos",
      value: fires,
      href: "/tickets?priority=fire",
      icon: Flame,
      tone: fires > 0 ? "destructive" : "secondary",
      hint: "Atencion inmediata",
    },
    {
      id: "deadlines",
      label: "Vencimientos 7 dias",
      value: deadlines,
      href: "/calendario",
      icon: CalendarClock,
      tone: deadlines > 0 ? "warning" : "secondary",
      hint: "Cobros y fechas clave",
    },
    {
      id: "deviations",
      label: "Proyectos en desvio",
      value: deviations,
      href: "/organizacion",
      icon: AlertTriangle,
      tone: deviations > 0 ? "destructive" : "secondary",
      hint: "Margen en riesgo",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visión operativa con foco en urgencias y bloqueos.
          </p>
        </div>
        <div className="rounded-full border border-border/80 bg-card p-1">
          <Link
            href="/dashboard?view=personal"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              currentView === "personal"
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground"
            }`}
          >
            Vista personal
          </Link>
          <Link
            href="/dashboard?view=global"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              currentView === "global"
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground"
            }`}
          >
            Vista global
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle className="text-base">Estado operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Indice de salud</p>
                <p className="text-4xl font-semibold tabular-nums">{healthScore}</p>
              </div>
              <Badge variant={healthScore >= 80 ? "success" : healthScore >= 55 ? "warning" : "destructive"}>
                {healthLabel}
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-2 rounded-full ${
                  healthScore >= 80
                    ? "bg-emerald-500"
                    : healthScore >= 55
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${Math.max(8, healthScore)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Calculado con fuegos activos, vencimientos próximos y proyectos en desvío.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accesos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickLink href="/tickets/nuevo" icon={Flame} label="Crear ticket" />
            <QuickLink href="/clientes/nuevo" icon={Briefcase} label="Nuevo cliente" />
            <QuickLink href="/propuestas" icon={ReceiptText} label="Ver propuestas" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {topPriorities.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href}>
              <Card className="h-full transition-colors hover:border-brand/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">{item.value}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={item.tone as "destructive" | "warning" | "secondary"}>{item.hint}</Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {blocks.map((block) => (
          <Link key={block.key} href={block.href}>
            <Card className="h-full transition-colors hover:border-brand/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {block.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {block.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Clic para abrir el módulo
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enfoque del día · Tickets urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            {focusData.urgentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tickets urgentes abiertos ahora mismo.
              </p>
            ) : (
              <div className="space-y-2">
                {focusData.urgentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href="/tickets"
                    className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm hover:border-brand/60"
                  >
                    <span className="truncate">{ticket.title}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge
                        variant={
                          ticket.priority === "fire"
                            ? "destructive"
                            : ticket.priority === "high"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {ticket.priority === "fire"
                          ? "Fuego"
                          : ticket.priority === "high"
                            ? "Alta"
                            : "Normal"}
                      </Badge>
                      {ticket.due_date && (
                        <Badge variant="outline">{ticket.due_date}</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline caliente</CardTitle>
          </CardHeader>
          <CardContent>
            {focusData.hotClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay clientes en propuesta o negociación.
              </p>
            ) : (
              <div className="space-y-2">
                {focusData.hotClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/clientes/${client.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm hover:border-brand/60"
                  >
                    <span className="truncate">{client.nombre}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={client.stage === "negotiation" ? "warning" : "secondary"}>
                        {client.stage === "negotiation" ? "Negociación" : "Propuesta"}
                      </Badge>
                      <Badge variant="outline">{fmtMoney(client.estimated_ltv ?? 0)}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Panel central conectado a tickets, propuestas, facturas, calendario y organización.
            Usa la vista personal para foco diario y la global para priorizar decisiones de equipo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm hover:border-brand/50 hover:bg-secondary/40"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

import Link from "next/link";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCalendarEvents } from "@/lib/calendar/queries";
import { fmtMoney } from "@/lib/utils";

import { CalendarGrid } from "./calendar-grid";

export const metadata = {
  title: "Calendario · GNERAI Finance",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const now = new Date();
  const year = Number(resolvedSearchParams.y) || now.getFullYear();
  const month = clamp(
    Number(resolvedSearchParams.m) || now.getMonth() + 1,
    1,
    12
  );

  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const todayISO = format(now, "yyyy-MM-dd");
  const events = await listCalendarEvents(
    format(gridStart, "yyyy-MM-dd"),
    format(gridEnd, "yyyy-MM-dd"),
    todayISO
  );

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  // Resumen del mes (solo eventos cuya fecha está dentro del mes en curso)
  const monthEvents = events.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= monthStart && d <= monthEnd;
  });

  const cobradoTotal = monthEvents
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + e.total, 0);
  const pendienteTotal = monthEvents
    .filter((e) => e.status === "pending")
    .reduce((acc, e) => acc + e.total, 0);
  const vencidoTotal = monthEvents
    .filter((e) => e.status === "overdue")
    .reduce((acc, e) => acc + e.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vencimientos y cobros del mes. Click en cada chip para ir al
            detalle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link
              href={`/calendario?y=${prevYear}&m=${prevMonth}`}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="min-w-[170px] text-center text-sm font-medium capitalize">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </span>
          <Button asChild variant="ghost" size="icon">
            <Link
              href={`/calendario?y=${nextYear}&m=${nextMonth}`}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/calendario?y=${now.getFullYear()}&m=${now.getMonth() + 1}`}
            >
              Hoy
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Cobrado este mes"
          value={cobradoTotal}
          color="emerald"
        />
        <SummaryCard
          label="Pendiente"
          value={pendienteTotal}
          color="amber"
        />
        <SummaryCard label="Vencido" value={vencidoTotal} color="rose" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="capitalize">
              {format(monthDate, "MMMM yyyy", { locale: es })}
            </CardTitle>
          </div>
          <Legend />
        </CardHeader>
        <CardContent className="p-0">
          <CalendarGrid year={year} month={month} events={events} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del mes</CardTitle>
          <CardDescription>
            Lista unificada de facturas, renovaciones y rotaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay eventos en este mes.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {monthEvents
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center gap-4 py-3 text-sm"
                  >
                    <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                      {format(
                        new Date(ev.date + "T00:00:00"),
                        "d MMM",
                        { locale: es }
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={ev.href} className="font-medium hover:underline">
                        {ev.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{ev.subtitle ?? "—"}</div>
                    </div>
                    {ev.total > 0 ? (
                      <span className="tabular-nums">{fmtMoney(ev.total)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <StatusBadge status={ev.status} />
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "rose";
}) {
  const dot =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {fmtMoney(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Cobrado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Pendiente
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        Vencido
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "paid" | "pending" | "overdue";
}) {
  if (status === "paid") return <Badge variant="success">Cobrado</Badge>;
  if (status === "pending") return <Badge variant="warning">Pendiente</Badge>;
  return <Badge variant="destructive">Vencido</Badge>;
}

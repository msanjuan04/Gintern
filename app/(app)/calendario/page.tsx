import Link from "next/link";
import {
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createCalendarManualEventAction } from "@/lib/calendar/actions";
import { listCalendarEvents } from "@/lib/calendar/queries";
import { fmtMoney } from "@/lib/utils";

import { CalendarWorkspace } from "./calendar-workspace";

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

  const todayISO = format(now, "yyyy-MM-dd");
  const events = await listCalendarEvents(
    format(monthStart, "yyyy-MM-dd"),
    format(monthEnd, "yyyy-MM-dd"),
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
            Centro de fechas clave: vencimientos, renovaciones y rotaciones.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/calendario?y=${now.getFullYear()}&m=${now.getMonth() + 1}`}
          >
            Volver a hoy
          </Link>
        </Button>
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

      <details className="group rounded-lg border border-border/70 bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
          <span>Añadir evento manual</span>
          <span className="text-xs text-muted-foreground group-open:hidden">Abrir</span>
          <span className="hidden text-xs text-muted-foreground group-open:inline">Cerrar</span>
        </summary>
        <CardContent className="border-t border-border/60 pt-4">
          <form action={createCalendarManualEventAction} className="grid gap-3 md:grid-cols-6">
            <input
              name="title"
              required
              placeholder="Añadir reunión, hito, deadline..."
              className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
            />
            <input
              name="date"
              type="date"
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              name="time"
              type="time"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <select
              name="category"
              defaultValue="meeting"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="meeting">Reunión</option>
              <option value="deadline">Fecha límite</option>
              <option value="milestone">Hito</option>
              <option value="note">Nota</option>
              <option value="other">Otro</option>
            </select>
            <select
              name="priority"
              defaultValue="normal"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <textarea
              name="description"
              placeholder="Contexto opcional"
              className="min-h-20 rounded-md border border-input bg-background p-3 text-sm md:col-span-5"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground md:self-end"
            >
              Guardar evento
            </button>
          </form>
        </CardContent>
      </details>

      <CalendarWorkspace
        year={year}
        month={month}
        events={events}
        todayISO={todayISO}
        prevHref={`/calendario?y=${prevYear}&m=${prevMonth}`}
        nextHref={`/calendario?y=${nextYear}&m=${nextMonth}`}
      />
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


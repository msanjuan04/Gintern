"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  deleteCalendarManualEventAction,
  toggleCalendarManualEventDoneAction,
  updateCalendarManualEventAction,
} from "@/lib/calendar/actions";
import type { CalendarEvent } from "@/lib/calendar/queries";
import { cn, fmtMoney } from "@/lib/utils";

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function StatusBadge({
  status,
}: {
  status: "paid" | "pending" | "overdue";
}) {
  if (status === "paid") return <Badge variant="success">Cobrado</Badge>;
  if (status === "pending") return <Badge variant="warning">Pendiente</Badge>;
  return <Badge variant="destructive">Vencido</Badge>;
}

export function CalendarWorkspace({
  year,
  month,
  events,
  todayISO,
  prevHref,
  nextHref,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  todayISO: string;
  prevHref: string;
  nextHref: string;
}) {
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const defaultSelected = useMemo(() => {
    if (todayISO.startsWith(`${year}-${String(month).padStart(2, "0")}`)) return todayISO;
    return format(monthStart, "yyyy-MM-dd");
  }, [todayISO, year, month, monthStart]);

  const [selectedDate, setSelectedDate] = useState(defaultSelected);
  const [typeFilter, setTypeFilter] = useState<"all" | CalendarEvent["kind"]>("all");

  const selectedDayEvents = (byDate.get(selectedDate) ?? [])
    .slice()
    .filter((ev) => typeFilter === "all" || ev.kind === typeFilter)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = events
    .filter((ev) => ev.date >= todayISO)
    .filter((ev) => typeFilter === "all" || ev.kind === typeFilter)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <ButtonMonth href={prevHref} ariaLabel="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </ButtonMonth>
          <CardTitle className="text-base capitalize">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </CardTitle>
          <ButtonMonth href={nextHref} ariaLabel="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </ButtonMonth>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayEvents = byDate.get(iso) ?? [];
              const inMonth = isSameMonth(day, monthDate);
              const today = isToday(day);
              const isSelected = selectedDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={cn(
                    "min-h-[88px] border-b border-r border-border/60 p-1.5 text-left transition-colors",
                    !inMonth && "bg-muted/30 text-muted-foreground/60",
                    today && "bg-brand-soft/30",
                    isSelected && "ring-1 ring-brand"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span
                      className={cn(
                        "tabular-nums",
                        today
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground"
                          : "font-medium"
                      )}
                    >
                      {format(day, "d", { locale: es })}
                    </span>
                    {dayEvents.length > 0 ? (
                      <span className="text-[10px] text-muted-foreground">{dayEvents.length}</span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          "truncate rounded-sm border px-1.5 py-0.5 text-[10px]",
                          ev.status === "paid"
                            ? "border-brand/30 bg-brand/10 text-foreground"
                            : ev.status === "pending"
                              ? "border-amber-500/25 bg-amber-500/10 text-foreground"
                              : "border-destructive/25 bg-destructive/10 text-foreground"
                        )}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 ? (
                      <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} más</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtrar eventos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                typeFilter === "all"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("subscription")}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                typeFilter === "subscription"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              Renovaciones
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("credential")}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                typeFilter === "credential"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              Credenciales
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("manual")}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                typeFilter === "manual"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              Manuales
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay próximos eventos.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((ev) => (
                  <li key={ev.id} className="rounded-md border border-border/70 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{ev.title}</p>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ev.date + "T00:00:00"), "d MMM", { locale: es })} ·{" "}
                      {ev.subtitle ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Detalle del día ·{" "}
              {format(new Date(selectedDate + "T00:00:00"), "d MMMM yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos apuntados para este día.</p>
            ) : (
              <ul className="space-y-2">
                {selectedDayEvents.map((ev) => (
                  <li key={ev.id} className="rounded-md border border-border/70 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={ev.href} className="truncate text-sm font-medium hover:underline">
                        {ev.title}
                      </Link>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.subtitle ?? "—"}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{ev.kind}</span>
                      <span className="tabular-nums">{ev.total > 0 ? fmtMoney(ev.total) : "—"}</span>
                    </div>
                    {ev.kind === "manual" && ev.source_id ? (
                      <ManualEventActions event={ev} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ManualEventActions({ event }: { event: CalendarEvent }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: event.title,
    date: event.date,
    time: event.manual_time ?? "",
    category: event.manual_category ?? "other",
    priority: event.manual_priority ?? "normal",
    description: event.manual_description ?? "",
  });

  async function toggleDone() {
    const fd = new FormData();
    fd.set("eventId", event.source_id!);
    fd.set("isDone", String(!event.is_done));
    await toggleCalendarManualEventDoneAction(fd);
  }

  async function removeEvent() {
    const ok = window.confirm("¿Eliminar este evento manual?");
    if (!ok) return;
    const fd = new FormData();
    fd.set("eventId", event.source_id!);
    await deleteCalendarManualEventAction(fd);
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={toggleDone}>
          {event.is_done ? "Marcar pendiente" : "Marcar completado"}
        </Button>
        <Button size="sm" variant="destructive" onClick={removeEvent}>
          Eliminar
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData();
              fd.set("eventId", event.source_id!);
              fd.set("title", draft.title);
              fd.set("date", draft.date);
              fd.set("time", draft.time);
              fd.set("category", draft.category);
              fd.set("priority", draft.priority);
              fd.set("description", draft.description);
              await updateCalendarManualEventAction(fd);
              setOpen(false);
            }}
          >
            <input
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              />
              <input
                type="time"
                value={draft.time}
                onChange={(e) => setDraft((prev) => ({ ...prev, time: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: e.target.value as "meeting" | "deadline" | "milestone" | "note" | "other",
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="meeting">Reunión</option>
                <option value="deadline">Fecha límite</option>
                <option value="milestone">Hito</option>
                <option value="note">Nota</option>
                <option value="other">Otro</option>
              </select>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    priority: e.target.value as "normal" | "high" | "critical",
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-20 rounded-md border border-input bg-background p-3 text-sm"
              placeholder="Descripción"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ButtonMonth({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary"
    >
      {children}
    </Link>
  );
}

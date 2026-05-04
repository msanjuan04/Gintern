import Link from "next/link";
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

import type { CalendarEvent } from "@/lib/calendar/queries";
import { cn, fmtMoney } from "@/lib/utils";

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarGrid({
  year,
  month,
  events,
}: {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
}) {
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = byDate.get(ev.date) ?? [];
    list.push(ev);
    byDate.set(ev.date, list);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        {/* Cabecera de días */}
        <div className="grid grid-cols-7 border-b border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="px-3 py-2">
              {d}
            </div>
          ))}
        </div>
        {/* Días */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const dayEvents = byDate.get(iso) ?? [];
            const inMonth = isSameMonth(day, monthDate);
            const today = isToday(day);
            return (
              <div
                key={iso}
                className={cn(
                  "min-h-[120px] border-b border-r border-border/60 p-2 transition-colors",
                  !inMonth && "bg-muted/40 text-muted-foreground/60",
                  today && "bg-brand-soft/40"
                )}
              >
                <div className="mb-2 flex items-center justify-between text-xs">
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
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <EventChip key={ev.id} event={ev} />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  const palette =
    event.status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
      : event.status === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
        : "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100";

  return (
    <Link
      href={event.href}
      className={cn(
        "flex flex-col rounded-sm border px-2 py-1 text-[11px] leading-tight transition-colors",
        palette
      )}
    >
      <span className="truncate font-medium">
        {event.title}
      </span>
      <span className="truncate text-[10px] opacity-80">{event.subtitle ?? "—"}</span>
      {event.total > 0 && <span className="tabular-nums">{fmtMoney(event.total)}</span>}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";

import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addTicketCommentAction,
  addTicketAttachmentAction,
  deleteTicketAction,
  moveTicketStatusAction,
} from "@/lib/tickets/actions";
import type { TicketBoardItem } from "@/lib/tickets/queries";

const STATUS_LABEL: Record<TicketBoardItem["status"], string> = {
  backlog: "Backlog",
  in_progress: "En Progreso",
  blocked: "Bloqueado",
  in_review: "En Revisión",
  done: "Terminado",
};

const STATUS_PILL: Record<TicketBoardItem["status"], string> = {
  backlog: "bg-secondary text-secondary-foreground",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  blocked: "bg-destructive/15 text-destructive",
  in_review: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  done: "bg-brand/15 text-brand",
};

const PRIORITY_BAR: Record<TicketBoardItem["priority"], string> = {
  fire: "bg-destructive",
  high: "bg-amber-500",
  normal: "bg-border",
};

const PRIORITY_LABEL: Record<TicketBoardItem["priority"], string> = {
  fire: "Fuego",
  high: "Alta",
  normal: "Normal",
};

const PRIORITY_DOT: Record<TicketBoardItem["priority"], string> = {
  fire: "bg-destructive",
  high: "bg-amber-500",
  normal: "bg-muted-foreground/40",
};

function getDueState(dueDate: string | null) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (Number.isNaN(due.getTime())) return null;
  if (due.getTime() < today.getTime()) return "overdue" as const;
  if (due.getTime() === today.getTime()) return "today" as const;
  return "ok" as const;
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
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

function Avatar({
  name,
  size = "sm",
}: {
  name: string | null | undefined;
  size?: "xs" | "sm";
}) {
  const dimensions = size === "xs" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimensions} ${avatarColor(
        name
      )}`}
      title={name ?? "Sin asignar"}
    >
      {getInitials(name)}
    </span>
  );
}

export function TicketsBoard({
  tickets,
  members,
  currentUserId,
  scope = "all",
}: {
  tickets: TicketBoardItem[];
  members: Array<{ id: string; name: string }>;
  currentUserId?: string | null;
  scope?: "all" | "active" | "closed";
}) {
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | TicketBoardItem["priority"]
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | TicketBoardItem["status"]
  >("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [ownershipMode, setOwnershipMode] = useState<"team" | "assigned-to-me">(
    "team"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const scopedTickets = useMemo(() => {
    if (scope === "active") return tickets.filter((t) => t.status !== "done");
    if (scope === "closed") return tickets.filter((t) => t.status === "done");
    return tickets;
  }, [tickets, scope]);

  const teamCount = scopedTickets.length;
  const myCount = currentUserId
    ? scopedTickets.filter((t) => t.assignee_id === currentUserId).length
    : 0;

  const ownedTickets = useMemo(() => {
    if (ownershipMode === "team") return scopedTickets;
    if (!currentUserId) return [];
    return scopedTickets.filter((ticket) => ticket.assignee_id === currentUserId);
  }, [scopedTickets, ownershipMode, currentUserId]);

  const filteredTickets = useMemo(() => {
    return ownedTickets.filter((ticket) => {
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }
      if (assigneeFilter !== "all" && ticket.assignee_id !== assigneeFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = [
        ticket.code ?? "",
        ticket.title,
        ticket.client_name ?? "",
        ticket.assignee_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [ownedTickets, normalizedQuery, priorityFilter, statusFilter, assigneeFilter]);

  const activeTickets = filteredTickets.filter((t) => t.status !== "done");
  const fireCount = filteredTickets.filter(
    (t) => t.priority === "fire" && t.status !== "done"
  ).length;
  const blockedCount = filteredTickets.filter((t) => t.status === "blocked").length;
  const closedCount = filteredTickets.filter((t) => t.status === "done").length;
  const closedFireCount = filteredTickets.filter(
    (t) => t.status === "done" && t.priority === "fire"
  ).length;
  const closedWithAttachmentCount = filteredTickets.filter(
    (t) => t.status === "done" && t.attachments.length > 0
  ).length;
  const myCcActiveCount = filteredTickets.filter(
    (t) =>
      t.status !== "done" &&
      !!currentUserId &&
      t.cc_members.some((cc) => cc.id === currentUserId)
  ).length;

  const hasActiveFilter =
    priorityFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    normalizedQuery !== "";

  return (
    <div className="space-y-6">
      {scope === "closed" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Tickets cerrados" value={closedCount} />
          <StatCard label="Cerrados críticos" value={closedFireCount} />
          <StatCard label="Cerrados con adjunto" value={closedWithAttachmentCount} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Tickets activos" value={activeTickets.length} />
          <StatCard label="Fuegos activos" value={fireCount} accent="destructive" />
          <StatCard label="Bloqueados" value={blockedCount} accent="warning" />
          <StatCard label="En copia para mí" value={myCcActiveCount} />
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card p-1 shadow-sm">
          <button
            onClick={() => setOwnershipMode("team")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              ownershipMode === "team"
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Tickets del equipo
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                ownershipMode === "team"
                  ? "bg-brand-foreground/20 text-brand-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {teamCount}
            </span>
          </button>
          <button
            onClick={() => setOwnershipMode("assigned-to-me")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              ownershipMode === "assigned-to-me"
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Solo míos
            <span
              className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                ownershipMode === "assigned-to-me"
                  ? "bg-brand-foreground/20 text-brand-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {myCount}
            </span>
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-baseline gap-2">
            <span>
              {ownershipMode === "team" ? "Tickets del equipo" : "Mis tickets"}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredTickets.length}
              {filteredTickets.length !== ownedTickets.length
                ? ` / ${ownedTickets.length}`
                : ""}
            </span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card p-1">
              <Link
                href="/tickets"
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  scope === "active"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Activos
              </Link>
              <Link
                href="/tickets/cerrados"
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  scope === "closed"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Cerrados
              </Link>
            </div>
            <Button asChild variant="brand">
              <Link href="/tickets/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear ticket
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por código, título, cliente o responsable..."
                className="pl-9"
              />
            </div>
            <Button
              variant={hasActiveFilter ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowFilters((prev) => !prev)}
              title="Filtrar tickets"
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilter && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand" />
              )}
            </Button>
            {showFilters && (
              <div className="absolute right-0 top-12 z-20 w-[340px] rounded-lg border border-border bg-card p-3 shadow-lg">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Prioridad
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target.value as "all" | TicketBoardItem["priority"]
                      )
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="fire">Fuego</option>
                  </select>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "all" | TicketBoardItem["status"]
                      )
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todos los estados</option>
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Responsable
                  </label>
                  <select
                    value={assigneeFilter}
                    onChange={(event) => setAssigneeFilter(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">Todos los responsables</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setPriorityFilter("all");
                      setStatusFilter("all");
                      setAssigneeFilter("all");
                      setShowFilters(false);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {filteredTickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-card/30 py-16 text-center">
              <p className="text-sm font-medium">
                {hasActiveFilter
                  ? "No hay tickets que coincidan con los filtros"
                  : ownershipMode === "assigned-to-me"
                    ? "No tienes tickets asignados"
                    : "No hay tickets aún"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasActiveFilter
                  ? "Prueba a limpiar la búsqueda o los filtros."
                  : "Crea el primero para empezar a hacer seguimiento."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead className="min-w-[280px]">Ticket</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Tiempo</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const isExpanded = expandedId === ticket.id;
                    const dueState = getDueState(ticket.due_date);
                    return (
                      <Fragment key={ticket.id}>
                        <TableRow
                          className={`group cursor-pointer border-l-2 transition-colors hover:bg-muted/40 ${
                            ticket.priority === "fire"
                              ? "border-l-destructive"
                              : ticket.priority === "high"
                                ? "border-l-amber-500"
                                : "border-l-transparent"
                          } ${isExpanded ? "bg-muted/30" : ""}`}
                          onClick={() =>
                            setExpandedId(isExpanded ? null : ticket.id)
                          }
                        >
                          <TableCell className="py-3 pr-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                                    PRIORITY_DOT[ticket.priority]
                                  }`}
                                  title={PRIORITY_LABEL[ticket.priority]}
                                />
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {ticket.code ?? "TK-pendiente"}
                                </span>
                                {ticket.has_running_timer && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                                    Activo
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold leading-tight">
                                {ticket.title}
                              </p>
                              {ticket.description && (
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-sm">
                            {ticket.client_name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={ticket.assignee_name} />
                              <div className="min-w-0">
                                <p className="truncate text-sm">
                                  {ticket.assignee_name ?? (
                                    <span className="text-muted-foreground">
                                      Sin asignar
                                    </span>
                                  )}
                                </p>
                                {ticket.cc_members.length > 0 && (
                                  <div className="mt-0.5 flex -space-x-1">
                                    {ticket.cc_members.slice(0, 3).map((cc) => (
                                      <Avatar key={cc.id} name={cc.name} size="xs" />
                                    ))}
                                    {ticket.cc_members.length > 3 && (
                                      <span className="inline-flex h-5 items-center justify-center rounded-full bg-muted px-1.5 text-[9px] font-semibold text-muted-foreground">
                                        +{ticket.cc_members.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_PILL[ticket.status]
                              }`}
                            >
                              {STATUS_LABEL[ticket.status]}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-sm ${
                                  dueState === "overdue"
                                    ? "font-semibold text-destructive"
                                    : dueState === "today"
                                      ? "font-semibold text-amber-600 dark:text-amber-400"
                                      : ""
                                }`}
                              >
                                {formatDueDate(ticket.due_date)}
                              </span>
                              {dueState === "overdue" && (
                                <span className="text-[10px] uppercase tracking-wide text-destructive">
                                  Vencido
                                </span>
                              )}
                              {dueState === "today" && (
                                <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                  Hoy
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex flex-col items-end gap-0.5 text-xs">
                              <span className="font-medium tabular-nums">
                                {Math.floor(ticket.spent_minutes / 60)}h
                              </span>
                              <span className="text-muted-foreground">
                                {ticket.activity_count} act.
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {ticket.status !== "in_progress" &&
                                ticket.status !== "done" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      startTransition(async () => {
                                        await moveTicketStatusAction(
                                          ticket.id,
                                          "in_progress"
                                        );
                                      })
                                    }
                                  >
                                    Empezar
                                  </Button>
                                )}
                              {ticket.status !== "done" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    startTransition(async () => {
                                      await moveTicketStatusAction(
                                        ticket.id,
                                        "done"
                                      );
                                    })
                                  }
                                >
                                  Cerrar
                                </Button>
                              )}
                              {ticket.status === "done" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    startTransition(async () => {
                                      await moveTicketStatusAction(
                                        ticket.id,
                                        "backlog"
                                      );
                                    })
                                  }
                                >
                                  Reabrir
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                onClick={() => {
                                  const ok = window.confirm(
                                    "¿Seguro que quieres eliminar este ticket?"
                                  );
                                  if (!ok) return;
                                  startTransition(async () => {
                                    await deleteTicketAction(ticket.id);
                                  });
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="py-0">
                              <ExpandedTicketDetails
                                ticket={ticket}
                                onAddComment={(formData) => {
                                  startTransition(async () => {
                                    await addTicketCommentAction(
                                      ticket.id,
                                      formData
                                    );
                                  });
                                }}
                                onAddAttachment={(formData) => {
                                  startTransition(async () => {
                                    await addTicketAttachmentAction(
                                      ticket.id,
                                      formData
                                    );
                                  });
                                }}
                                onChangeStatus={(value) => {
                                  startTransition(async () => {
                                    await moveTicketStatusAction(ticket.id, value);
                                  });
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpandedTicketDetails({
  ticket,
  onAddComment,
  onAddAttachment,
  onChangeStatus,
}: {
  ticket: TicketBoardItem;
  onAddComment: (formData: FormData) => void;
  onAddAttachment: (formData: FormData) => void;
  onChangeStatus: (status: TicketBoardItem["status"]) => void;
}) {
  return (
    <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        {ticket.description && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.description}
            </p>
          </section>
        )}

        <section className="rounded-md border border-border/60 bg-background p-3">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cambiar estado
          </h4>
          <select
            aria-label="Cambiar estado"
            defaultValue={ticket.status}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            onChange={(event) =>
              onChangeStatus(event.target.value as TicketBoardItem["status"])
            }
          >
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Comentarios ({ticket.comments.length})
          </h4>
          {ticket.comments.length > 0 ? (
            <div className="space-y-2">
              {ticket.comments.slice(0, 5).map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md border border-border/60 bg-background p-2.5"
                >
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {comment.author_name}
                    </span>{" "}
                    · {new Date(comment.created_at).toLocaleString("es-ES")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {comment.body}
                  </p>
                </div>
              ))}
              {ticket.comments.length > 5 && (
                <p className="text-[11px] text-muted-foreground">
                  + {ticket.comments.length - 5} comentarios anteriores
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aún no hay comentarios.
            </p>
          )}
          <form
            action={(formData) => onAddComment(formData)}
            className="mt-2 flex gap-2"
          >
            <Input
              name="body"
              placeholder="Escribe un comentario... (usa @nombre o @email)"
              className="h-8 text-xs"
            />
            <Button size="sm" type="submit">
              Comentar
            </Button>
          </form>
        </section>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Adjuntos ({ticket.attachments.length})
          </h4>
          {ticket.attachments.length > 0 ? (
            <div className="space-y-1">
              {ticket.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={
                    attachment.external_url ||
                    attachment.file_url ||
                    undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded border border-border/60 bg-background px-2 py-1 text-xs text-brand hover:underline"
                >
                  {attachment.label ||
                    attachment.external_url ||
                    attachment.file_path ||
                    "Adjunto"}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin adjuntos.</p>
          )}
          <form
            action={(formData) => onAddAttachment(formData)}
            className="mt-2 grid gap-2"
          >
            <Input
              name="label"
              placeholder="Etiqueta"
              className="h-8 text-xs"
            />
            <Input
              name="externalUrl"
              placeholder="https://..."
              className="h-8 text-xs"
            />
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
              Seleccionar archivo
              <input name="file" type="file" className="hidden" />
            </label>
            <Button size="sm" variant="ghost" type="submit">
              Adjuntar
            </Button>
          </form>
        </section>

        {ticket.cc_members.length > 0 && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              En copia
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {ticket.cc_members.map((member) => (
                <span
                  key={member.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs"
                >
                  <Avatar name={member.name} size="xs" />
                  {member.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {ticket.dependencies.length > 0 && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dependencias ({ticket.dependencies.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ticket.dependencies.map((dependency) => (
                <Badge key={dependency.id} variant="outline">
                  {(dependency.code ?? "TK-?") + " · " + dependency.title}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "destructive" | "warning";
}) {
  const valueColor =
    accent === "destructive" && value > 0
      ? "text-destructive"
      : accent === "warning" && value > 0
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueColor}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

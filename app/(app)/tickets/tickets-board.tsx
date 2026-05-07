"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Plus, Search, SlidersHorizontal } from "lucide-react";

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

const STATUS_BADGE: Record<TicketBoardItem["status"], "secondary" | "warning" | "destructive" | "success"> = {
  backlog: "secondary",
  in_progress: "warning",
  blocked: "destructive",
  in_review: "warning",
  done: "success",
};

function priorityBadge(priority: TicketBoardItem["priority"]) {
  if (priority === "fire") return <Badge variant="destructive">Fuego</Badge>;
  if (priority === "high") return <Badge variant="warning">Alta</Badge>;
  return <Badge variant="secondary">Normal</Badge>;
}

function priorityCardBorder(priority: TicketBoardItem["priority"]) {
  if (priority === "fire") return "border-l-4 border-l-destructive";
  if (priority === "high") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-border";
}

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
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [ownershipMode, setOwnershipMode] = useState<"team" | "assigned-to-me">(
    "team"
  );

  const normalizedQuery = query.trim().toLowerCase();
  const scopedTickets = useMemo(() => {
    if (scope === "active") return tickets.filter((t) => t.status !== "done");
    if (scope === "closed") return tickets.filter((t) => t.status === "done");
    return tickets;
  }, [tickets, scope]);

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
          <StatCard label="Fuegos activos" value={fireCount} />
          <StatCard label="Bloqueados" value={blockedCount} />
          <StatCard label="En copia para mí" value={myCcActiveCount} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets del equipo</CardTitle>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-border/80 bg-card p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewMode === "cards"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewMode === "table"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Tabla
              </button>
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
            <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card p-1">
              <button
                onClick={() => setOwnershipMode("team")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  ownershipMode === "team"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Equipo
              </button>
              <button
                onClick={() => setOwnershipMode("assigned-to-me")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  ownershipMode === "assigned-to-me"
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Mis tickets
              </button>
            </div>
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
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowFilters((prev) => !prev)}
              title="Filtrar tickets"
            >
              <SlidersHorizontal className="h-4 w-4" />
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay tickets que coincidan con la búsqueda.
            </p>
          ) : viewMode === "cards" ? (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className={`rounded-lg border border-border/70 bg-card/40 p-3 shadow-sm transition-colors hover:border-brand/40 ${priorityCardBorder(ticket.priority)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {ticket.code ?? "TK-pendiente"}
                      </p>
                      <p className="truncate text-sm font-semibold">{ticket.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {priorityBadge(ticket.priority)}
                      <Badge variant={STATUS_BADGE[ticket.status]}>
                        {STATUS_LABEL[ticket.status]}
                      </Badge>
                      {getDueState(ticket.due_date) === "overdue" && (
                        <Badge variant="destructive">Vencido</Badge>
                      )}
                      {getDueState(ticket.due_date) === "today" && (
                        <Badge variant="warning">Vence hoy</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant="outline">Cliente: {ticket.client_name ?? "—"}</Badge>
                    <Badge variant="outline">
                      Responsable: {ticket.assignee_name ?? "Sin asignar"}
                    </Badge>
                    <Badge variant="outline">Límite: {ticket.due_date ?? "—"}</Badge>
                    <Badge variant="outline">
                      Tiempo: {Math.floor(ticket.spent_minutes / 60)}h
                    </Badge>
                    <Badge variant="outline">Actividad: {ticket.activity_count}</Badge>
                  </div>

                  {ticket.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {ticket.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 border-t border-border/60 pt-2">
                    {ticket.status !== "in_progress" && ticket.status !== "done" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            await moveTicketStatusAction(ticket.id, "in_progress");
                          })
                        }
                      >
                        Empezar
                      </Button>
                    )}
                    {ticket.status !== "blocked" && ticket.status !== "done" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            await moveTicketStatusAction(ticket.id, "blocked");
                          })
                        }
                      >
                        Bloquear
                      </Button>
                    )}
                    {ticket.status !== "done" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          startTransition(async () => {
                            await moveTicketStatusAction(ticket.id, "done");
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
                        onClick={() =>
                          startTransition(async () => {
                            await moveTicketStatusAction(ticket.id, "backlog");
                          })
                        }
                      >
                        Reabrir
                      </Button>
                    )}

                    <select
                      aria-label="Cambiar estado"
                      defaultValue={ticket.status}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      onChange={(event) => {
                        const value = event.target.value as TicketBoardItem["status"];
                        startTransition(async () => {
                          await moveTicketStatusAction(ticket.id, value);
                        });
                      }}
                    >
                      {Object.entries(STATUS_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const ok = window.confirm("¿Seguro que quieres eliminar este ticket?");
                        if (!ok) return;
                        startTransition(async () => {
                          await deleteTicketAction(ticket.id);
                        });
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>

                  <details className="mt-2 rounded-md border border-border/60 bg-background p-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Detalle ({ticket.comments.length} comentarios, {ticket.attachments.length} adjuntos,{" "}
                      {ticket.dependencies.length} dependencias)
                    </summary>
                    {ticket.cc_members.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">En copia:</span>
                        {ticket.cc_members.map((member) => (
                          <Badge key={member.id} variant="outline">
                            {member.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {ticket.dependencies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ticket.dependencies.map((dependency) => (
                          <Badge key={dependency.id} variant="outline">
                            {(dependency.code ?? "TK-?") + " · " + dependency.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {ticket.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {ticket.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.external_url || attachment.file_url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-xs text-brand hover:underline"
                          >
                            {attachment.label ||
                              attachment.external_url ||
                              attachment.file_path ||
                              "Adjunto"}
                          </a>
                        ))}
                      </div>
                    )}
                    <form
                      action={(formData) => {
                        startTransition(async () => {
                          await addTicketAttachmentAction(ticket.id, formData);
                        });
                      }}
                      className="mt-2 grid gap-2 md:grid-cols-3"
                    >
                      <Input name="label" placeholder="Etiqueta adjunto" className="h-8 text-xs" />
                      <Input name="externalUrl" placeholder="https://..." className="h-8 text-xs" />
                      <div className="flex items-center justify-center">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                          Seleccionar archivo
                          <input name="file" type="file" className="hidden" />
                        </label>
                      </div>
                      <div className="md:col-span-3">
                        <Button size="sm" variant="ghost" type="submit">
                          Adjuntar archivo/link
                        </Button>
                      </div>
                    </form>
                    <div className="mt-2">
                      {ticket.comments.length > 0 && (
                        <div className="space-y-2">
                          {ticket.comments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="rounded-md border border-border/60 p-2">
                              <p className="text-[11px] text-muted-foreground">
                                {comment.author_name} · {new Date(comment.created_at).toLocaleString()}
                              </p>
                              <p className="mt-1 text-xs">{comment.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <form
                        action={(formData) => {
                          startTransition(async () => {
                            await addTicketCommentAction(ticket.id, formData);
                          });
                        }}
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
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Límite</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{ticket.title}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {ticket.code ?? "TK-pendiente"}
                          </p>
                          {ticket.description && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.client_name ?? "—"}</TableCell>
                      <TableCell>{ticket.assignee_name ?? "Sin asignar"}</TableCell>
                      <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[ticket.status]}>
                          {STATUS_LABEL[ticket.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.due_date ?? "—"}</TableCell>
                      <TableCell>{Math.floor(ticket.spent_minutes / 60)}h</TableCell>
                      <TableCell>{ticket.activity_count}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getDueState(ticket.due_date) === "overdue" && (
                            <Badge variant="destructive">Vencido</Badge>
                          )}
                          {getDueState(ticket.due_date) === "today" && (
                            <Badge variant="warning">Vence hoy</Badge>
                          )}
                          {ticket.dependencies.length > 0 && (
                            <Badge variant="outline">
                              {ticket.dependencies.length} depend.
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              startTransition(async () => {
                                await moveTicketStatusAction(ticket.id, "in_progress");
                              })
                            }
                          >
                            Empezar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const ok = window.confirm(
                                "¿Seguro que quieres eliminar este ticket?"
                              );
                              if (!ok) return;
                              startTransition(async () => {
                                await deleteTicketAction(ticket.id);
                              });
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

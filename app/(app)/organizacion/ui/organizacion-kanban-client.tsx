"use client";

import { useTransition } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Clock3, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createOrganizationTaskAction,
  updateOrganizationTaskStatusAction,
} from "@/lib/organizacion/_actions/tasks";
import type { OrganizationDashboardData, OrganizationTaskStatus } from "@/lib/organizacion/_services/queries";

const KANBAN_COLUMNS: Array<{ key: OrganizationTaskStatus; label: string }> = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "En progreso" },
  { key: "blocked", label: "Bloqueado" },
  { key: "done", label: "Done" },
];

const COLUMN_STYLES: Record<
  OrganizationTaskStatus,
  { card: string; badge: "secondary" | "warning" | "destructive" | "success"; icon: typeof CircleDot }
> = {
  todo: {
    card: "border-slate-300/70 bg-slate-50/60",
    badge: "secondary",
    icon: CircleDot,
  },
  in_progress: {
    card: "border-blue-300/70 bg-blue-50/60",
    badge: "warning",
    icon: Clock3,
  },
  blocked: {
    card: "border-rose-300/70 bg-rose-50/60",
    badge: "destructive",
    icon: AlertTriangle,
  },
  done: {
    card: "border-emerald-300/70 bg-emerald-50/60",
    badge: "success",
    icon: CheckCircle2,
  },
};

function priorityLabel(priority: "low" | "medium" | "high") {
  return priority === "high" ? "Alta" : priority === "medium" ? "Media" : "Baja";
}

function priorityBadge(priority: "low" | "medium" | "high"): "secondary" | "warning" | "destructive" {
  return priority === "high" ? "destructive" : priority === "medium" ? "warning" : "secondary";
}

export function OrganizacionKanbanClient({ data }: { data: OrganizationDashboardData }) {
  const [isPending, startTransition] = useTransition();

  const teamTasks = data.tasks.team;
  const myTasks = data.tasks.mine;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pendientes equipo" value={String(data.kpis.teamPending)} />
        <KpiCard label="En progreso" value={String(data.kpis.teamInProgress)} />
        <KpiCard label="Bloqueadas" value={String(data.kpis.teamBlocked)} />
        <KpiCard label="Completadas (7 dias)" value={String(data.kpis.doneLast7d)} />
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="h-11 rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="team" className="rounded-lg">Equipo</TabsTrigger>
          <TabsTrigger value="personal" className="rounded-lg">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <TaskCreateCard
            mode="team"
            members={data.members}
            isPending={isPending}
            onSubmit={(formData) => startTransition(async () => createOrganizationTaskAction(formData))}
          />
          <KanbanBoard
            rows={teamTasks}
            isPending={isPending}
            onChangeStatus={(taskId, status) =>
              startTransition(async () => updateOrganizationTaskStatusAction({ taskId, status }))
            }
          />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <TaskCreateCard
            mode="personal"
            members={data.members}
            isPending={isPending}
            onSubmit={(formData) => startTransition(async () => createOrganizationTaskAction(formData))}
          />
          <KanbanBoard
            rows={myTasks}
            isPending={isPending}
            onChangeStatus={(taskId, status) =>
              startTransition(async () => updateOrganizationTaskStatusAction({ taskId, status }))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/80">
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function TaskCreateCard({
  mode,
  members,
  isPending,
  onSubmit,
}: {
  mode: "team" | "personal";
  members: OrganizationDashboardData["members"];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="flex justify-end">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {mode === "team" ? "Crear tarea de equipo" : "Crear tarea personal"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "team" ? "Nueva tarea de equipo" : "Nueva tarea personal"}
            </DialogTitle>
            <DialogDescription>
              Completa los campos clave y crea la tarea en tu tablero.
            </DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="scope" value={mode} />
            <Input name="title" placeholder="Titulo de la tarea" className="md:col-span-2" />
            <Input name="description" placeholder="Descripcion breve" className="md:col-span-2" />
            <select name="priority" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select
              name="assigneeId"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              disabled={mode === "personal"}
            >
              {mode === "personal" ? (
                <option value="">Yo</option>
              ) : (
                members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name ?? member.email ?? member.id}
                  </option>
                ))
              )}
            </select>
            <Input type="date" name="dueDate" className="md:col-span-2" />
            <div className="md:col-span-2 flex justify-end">
              <Button disabled={isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                {isPending ? "Guardando..." : "Crear tarea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanBoard({
  rows,
  isPending,
  onChangeStatus,
}: {
  rows: OrganizationDashboardData["tasks"]["all"];
  isPending: boolean;
  onChangeStatus: (taskId: string, status: OrganizationTaskStatus) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((column) => {
        const columnRows = rows.filter((row) => row.status === column.key);
        const Icon = COLUMN_STYLES[column.key].icon;
        return (
          <Card key={column.key} className={`rounded-2xl border ${COLUMN_STYLES[column.key].card}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {column.label}
                </span>
                <Badge variant={COLUMN_STYLES[column.key].badge}>{columnRows.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[340px]">
              {columnRows.map((row) => (
                <div key={row.id} className="rounded-xl border border-border/80 bg-background p-3 shadow-sm">
                  <p className="text-sm font-medium">{row.title}</p>
                  {row.description ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{row.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={priorityBadge(row.priority)}>{priorityLabel(row.priority)}</Badge>
                    <Badge variant="outline">{row.scope === "team" ? "Equipo" : "Personal"}</Badge>
                    <Badge variant="outline">
                      {row.assignee?.full_name ?? row.assignee?.email ?? "Sin asignar"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">
                      Vence: {row.due_date ?? "Sin fecha"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      value={row.status}
                      disabled={isPending}
                      onChange={(event) =>
                        onChangeStatus(row.id, event.target.value as OrganizationTaskStatus)
                      }
                    >
                      <option value="todo">todo</option>
                      <option value="in_progress">in_progress</option>
                      <option value="blocked">blocked</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                </div>
              ))}
              {columnRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-3 text-center text-xs text-muted-foreground">
                  Sin tareas en esta columna.
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


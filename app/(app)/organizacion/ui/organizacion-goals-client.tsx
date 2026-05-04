"use client";

import { useTransition } from "react";
import { Target, Trophy, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { createOrganizationGoalAction } from "@/lib/organizacion/_actions/goals";
import type { OrganizationDashboardData } from "@/lib/organizacion/_services/queries";

export function OrganizacionGoalsClient({ data }: { data: OrganizationDashboardData }) {
  const [isPending, startTransition] = useTransition();

  const teamGoals = data.goals.filter((goal) => goal.scope === "team");
  const personalGoals = data.goals.filter((goal) => goal.scope === "personal");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GoalKpi
          label="Objetivos de equipo"
          value={String(teamGoals.length)}
          icon={Trophy}
        />
        <GoalKpi
          label="Objetivos personales"
          value={String(personalGoals.length)}
          icon={UserRound}
        />
        <GoalKpi
          label="Objetivos totales"
          value={String(data.goals.length)}
          icon={Target}
        />
      </div>

      <GoalCreateCard
        members={data.members}
        isPending={isPending}
        onSubmit={(formData) => startTransition(async () => createOrganizationGoalAction(formData))}
      />

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="h-11 rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="team" className="rounded-lg">Equipo</TabsTrigger>
          <TabsTrigger value="personal" className="rounded-lg">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-3">
          <GoalsGrid goals={teamGoals} />
        </TabsContent>

        <TabsContent value="personal" className="space-y-3">
          <GoalsGrid goals={personalGoals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalCreateCard({
  members,
  isPending,
  onSubmit,
}: {
  members: OrganizationDashboardData["members"];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="flex justify-end">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Crear objetivo</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo objetivo</DialogTitle>
            <DialogDescription>
              Define objetivo, alcance, responsable y progreso inicial.
            </DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
            <Input name="title" placeholder="Titulo del objetivo" className="md:col-span-2" />
            <Input name="description" placeholder="Descripcion" className="md:col-span-2" />
            <select name="scope" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="personal">personal</option>
              <option value="team">team</option>
            </select>
            <select name="ownerId" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name ?? member.email ?? member.id}
                </option>
              ))}
            </select>
            <Input type="number" step="0.01" name="targetValue" placeholder="Meta" />
            <Input type="number" step="0.01" name="currentValue" placeholder="Actual" />
            <Input type="date" name="targetDate" className="md:col-span-2" />
            <div className="md:col-span-2 flex justify-end">
              <Button disabled={isPending}>{isPending ? "Guardando..." : "Crear objetivo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalsGrid({ goals }: { goals: OrganizationDashboardData["goals"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => {
        const progress =
          goal.target_value > 0
            ? Math.max(0, Math.min(100, (goal.current_value / goal.target_value) * 100))
            : 0;
        return (
          <Card key={goal.id} className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{goal.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goal.description ? <p className="text-sm text-muted-foreground">{goal.description}</p> : null}
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className={`h-2.5 rounded-full ${
                    progress >= 100 ? "bg-emerald-600" : progress >= 60 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{goal.current_value.toFixed(2)}</span>
                <span>{progress.toFixed(0)}%</span>
                <span>{goal.target_value.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge variant={goal.scope === "team" ? "success" : "outline"}>
                  {goal.scope === "team" ? "Equipo" : "Personal"}
                </Badge>
                <span className="text-muted-foreground">{goal.target_date ?? "Sin fecha"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Responsable: {goal.owner?.full_name ?? goal.owner?.email ?? "Sin asignar"}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {goals.length === 0 ? (
        <Card className="rounded-2xl md:col-span-2 xl:col-span-3">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aun no hay objetivos creados.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function GoalKpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Target;
}) {
  return (
    <Card className="rounded-2xl border-border/80">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}


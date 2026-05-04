"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  KanbanSquare,
  Search,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrganizationDashboardData } from "@/lib/organizacion/_services/queries";
import { goalDeadlineTone, goalProgressPercent } from "@/lib/organizacion/goal-utils";

import { OrganizacionGoalCard } from "./organizacion-goal-card";
import { OrganizacionGoalCreateDialog } from "./organizacion-goal-create-dialog";

export function OrganizacionGoalsClient({ data }: { data: OrganizationDashboardData }) {
  const [query, setQuery] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const teamGoals = data.goals.filter((g) => g.scope === "team");
  const personalGoals = data.goals.filter((g) => g.scope === "personal");

  const completed = useMemo(
    () =>
      data.goals.filter((g) => goalProgressPercent(g.target_value, g.current_value) >= 100)
        .length,
    [data.goals]
  );

  const atRisk = useMemo(
    () =>
      data.goals.filter((g) => {
        const p = goalProgressPercent(g.target_value, g.current_value);
        if (p >= 100) return false;
        const tone = goalDeadlineTone(g.target_date, today, p);
        return tone === "overdue" || tone === "soon";
      }).length,
    [data.goals, today]
  );

  const needle = query.trim().toLowerCase();
  const match = (goals: OrganizationDashboardData["goals"]) => {
    if (!needle) return goals;
    return goals.filter(
      (g) =>
        g.title.toLowerCase().includes(needle) ||
        (g.description?.toLowerCase().includes(needle) ?? false)
    );
  };

  const filteredTeam = match(teamGoals);
  const filteredPersonal = match(personalGoals);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o descripción…"
            className="pl-9"
          />
        </div>
        <OrganizacionGoalCreateDialog
          members={data.members}
          currentUserId={data.me.id}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Trophy}
          label="Objetivos de equipo"
          value={teamGoals.length}
          hint="Visibles para todo el equipo activo"
        />
        <Kpi
          icon={UserRound}
          label="Personales"
          value={personalGoals.length}
          hint="Solo tú y admins"
        />
        <Kpi
          icon={CheckCircle2}
          label="Completados"
          value={completed}
          hint="Progreso ≥ 100%"
          accent="success"
        />
        <Kpi
          icon={AlertTriangle}
          label="Requieren atención"
          value={atRisk}
          hint="Vencidos o fecha en 14 días"
          accent={atRisk > 0 ? "warning" : "default"}
        />
      </div>

      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <KanbanSquare className="h-3.5 w-3.5" />
        El trabajo accionable día a día está en{" "}
        <Link href="/tickets" className="font-medium text-brand hover:underline">
          Tickets
        </Link>
        .
      </p>

      <Tabs defaultValue="team" className="space-y-5">
        <TabsList className="h-11 w-full max-w-md rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="team" className="flex-1 rounded-lg gap-2">
            <Trophy className="h-3.5 w-3.5 opacity-70" />
            Equipo
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {filteredTeam.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex-1 rounded-lg gap-2">
            <UserRound className="h-3.5 w-3.5 opacity-70" />
            Personal
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {filteredPersonal.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-0">
          <GoalsSection
            goals={filteredTeam}
            empty="No hay objetivos de equipo. Crea uno para alinear hitos trimestrales o métricas compartidas."
            currentUserId={data.me.id}
          />
        </TabsContent>
        <TabsContent value="personal" className="mt-0">
          <GoalsSection
            goals={filteredPersonal}
            empty="No hay objetivos personales. Úsalos para foco semanal o hábitos sin mezclarlos con el tablero de equipo."
            currentUserId={data.me.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalsSection({
  goals,
  empty,
  currentUserId,
}: {
  goals: OrganizationDashboardData["goals"];
  empty: string;
  currentUserId: string;
}) {
  if (goals.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-border/80 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <Target className="h-10 w-10 text-muted-foreground/50" />
          <p className="max-w-sm text-sm text-muted-foreground">{empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <OrganizacionGoalCard key={goal.id} goal={goal} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  accent = "default",
}: {
  icon: typeof Target;
  label: string;
  value: number;
  hint: string;
  accent?: "default" | "success" | "warning";
}) {
  const valueClass =
    accent === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "warning" && value > 0
        ? "text-amber-600 dark:text-amber-400"
        : "";

  return (
    <Card className="rounded-2xl border-border/70 bg-card/50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground/80" />
        </div>
        <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

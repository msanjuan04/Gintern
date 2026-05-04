"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="relative min-w-0 flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o descripción…"
            className="pl-9"
          />
        </div>
        <OrganizacionGoalCreateDialog members={data.members} currentUserId={data.me.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Objetivos de equipo" value={String(teamGoals.length)} />
        <MetricCard label="Objetivos personales" value={String(personalGoals.length)} />
        <MetricCard label="Completados" value={String(completed)} />
        <MetricCard label="Requieren atención" value={String(atRisk)} />
      </div>

      <p className="text-sm text-muted-foreground">
        ¿Tareas y entregas?{" "}
        <Link href="/tickets" className="text-brand hover:underline">
          Ir a Tickets
        </Link>
        .
      </p>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Equipo ({filteredTeam.length})</TabsTrigger>
          <TabsTrigger value="personal">Personal ({filteredPersonal.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-0">
          <GoalsSection
            goals={filteredTeam}
            empty="No hay objetivos de equipo. Crea el primero con el botón de arriba."
            currentUserId={data.me.id}
          />
        </TabsContent>
        <TabsContent value="personal" className="mt-0">
          <GoalsSection
            goals={filteredPersonal}
            empty="No hay objetivos personales."
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
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">{empty}</CardContent>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

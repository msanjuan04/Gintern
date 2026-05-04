"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationGoalProgressAction } from "@/lib/organizacion/_actions/goals";
import {
  formatGoalDeadlineLabel,
  goalDeadlineTone,
  goalProgressPercent,
} from "@/lib/organizacion/goal-utils";
import type { OrganizationGoal } from "@/lib/organizacion/_services/queries";
import { cn } from "@/lib/utils";

export function OrganizacionGoalCard({
  goal,
  currentUserId,
}: {
  goal: OrganizationGoal;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const progress = goalProgressPercent(goal.target_value, goal.current_value);
  const tone = goalDeadlineTone(goal.target_date, today, progress);
  const deadlineLabel = formatGoalDeadlineLabel(tone, goal.target_date);
  const isMine = goal.owner_id === currentUserId;

  const ringClass =
    tone === "overdue"
      ? "ring-2 ring-destructive/40"
      : tone === "soon"
        ? "ring-2 ring-amber-500/35"
        : tone === "done"
          ? "ring-2 ring-emerald-500/30"
          : "";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border-border/70 bg-gradient-to-b from-card to-card/80 shadow-sm transition-shadow hover:shadow-md",
        ringClass
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
              {goal.title}
            </p>
            {goal.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
            ) : null}
          </div>
          <Badge
            variant={goal.scope === "team" ? "default" : "secondary"}
            className="shrink-0 text-[10px] uppercase tracking-wide"
          >
            {goal.scope === "team" ? "Equipo" : "Personal"}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="tabular-nums">Actual {formatNum(goal.current_value)}</span>
            <span className="font-medium text-foreground tabular-nums">{progress.toFixed(0)}%</span>
            <span className="tabular-nums">Meta {formatNum(goal.target_value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tone === "done"
                  ? "bg-emerald-500"
                  : progress >= 60
                    ? "bg-emerald-500/90"
                    : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span
              className={cn(
                tone === "overdue" && "font-medium text-destructive",
                tone === "soon" && "font-medium text-amber-700 dark:text-amber-500"
              )}
            >
              {deadlineLabel}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {goal.owner?.full_name || goal.owner?.email || "Sin asignar"}
          </span>
          {isMine ? (
            <Badge variant="outline" className="text-[10px]">
              Tú
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end border-t border-border/60 pt-3 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                Actualizar progreso
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar avance</DialogTitle>
                <DialogDescription className="line-clamp-2">{goal.title}</DialogDescription>
              </DialogHeader>
              <form
                action={async (formData) => {
                  await updateOrganizationGoalProgressAction(formData);
                  setOpen(false);
                  router.refresh();
                }}
                className="space-y-4"
              >
                <input type="hidden" name="goalId" value={goal.id} />
                <div className="space-y-2">
                  <Label htmlFor={`cv-${goal.id}`}>Valor actual</Label>
                  <Input
                    id={`cv-${goal.id}`}
                    name="currentValue"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    defaultValue={goal.current_value}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Meta: {formatNum(goal.target_value)} · puedes superarla si ya la cumpliste.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button type="submit" size="sm">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

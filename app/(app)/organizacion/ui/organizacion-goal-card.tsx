"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

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

  return (
    <Card className="rounded-xl border-border/70 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug">{goal.title}</CardTitle>
          <Badge variant={goal.scope === "team" ? "warning" : "secondary"}>
            {goal.scope === "team" ? "Equipo" : "Personal"}
          </Badge>
        </div>
        {goal.description ? (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">Actual {formatNum(goal.current_value)}</span>
            <span className="font-medium text-foreground tabular-nums">{progress.toFixed(0)}%</span>
            <span className="tabular-nums">Meta {formatNum(goal.target_value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              tone === "overdue" && "font-medium text-destructive",
              tone === "soon" && "font-medium text-amber-700 dark:text-amber-500"
            )}
          >
            {deadlineLabel}
          </span>
          <span>·</span>
          <span>{goal.owner?.full_name || goal.owner?.email || "Sin asignar"}</span>
          {isMine ? (
            <>
              <span>·</span>
              <span className="text-foreground">Tú</span>
            </>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-border/60 pt-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <TrendingUp className="h-4 w-4" />
                Actualizar progreso
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  <p className="text-xs text-muted-foreground">
                    Meta: {formatNum(goal.target_value)}.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button type="submit" size="sm" variant="brand">
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

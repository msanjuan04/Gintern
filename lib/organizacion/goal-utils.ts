/** Utilidades puras para UI de objetivos (sin depender de React ni Supabase). */

export function goalProgressPercent(targetValue: number, currentValue: number): number {
  if (targetValue <= 0) return 0;
  return Math.max(0, Math.min(100, (currentValue / targetValue) * 100));
}

export type GoalDeadlineTone = "none" | "overdue" | "soon" | "ok" | "done";

/**
 * `todayISO` y `targetDate` en formato YYYY-MM-DD.
 * `soonDays`: días para considerar la fecha "cerca".
 */
export function goalDeadlineTone(
  targetDate: string | null,
  todayISO: string,
  progressPercent: number,
  soonDays = 14
): GoalDeadlineTone {
  if (progressPercent >= 100) return "done";
  if (!targetDate) return "none";
  if (targetDate < todayISO) return "overdue";
  const t = new Date(targetDate).getTime();
  const today = new Date(todayISO).getTime();
  const diffDays = Math.ceil((t - today) / (24 * 60 * 60 * 1000));
  if (diffDays >= 0 && diffDays <= soonDays) return "soon";
  return "ok";
}

export function formatGoalDeadlineLabel(
  tone: GoalDeadlineTone,
  targetDate: string | null
): string {
  if (tone === "none") return "Sin fecha límite";
  if (!targetDate) return "Sin fecha límite";
  if (tone === "done") return `Meta · ${targetDate}`;
  if (tone === "overdue") return `Vencido · ${targetDate}`;
  if (tone === "soon") return `Próximo · ${targetDate}`;
  return `Objetivo · ${targetDate}`;
}

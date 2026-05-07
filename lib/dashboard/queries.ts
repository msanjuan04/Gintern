import "server-only";

import { listActivityLogs, type ActivityLogListItem } from "@/lib/activity-logs/queries";
import { listCalendarEvents, type CalendarEvent } from "@/lib/calendar/queries";
import { getFinanceDataBundle } from "@/lib/finanzas/_services/queries";
import { getOrganizationDashboardData, type OrganizationGoal } from "@/lib/organizacion/_services/queries";
import { listProposals, type ProposalListItem } from "@/lib/proposals/queries";
import { createClient } from "@/lib/supabase/server";
import { listTicketBoard, type TicketBoardItem } from "@/lib/tickets/queries";

export type DashboardAlertKind =
  | "fires"
  | "renewals"
  | "rotations"
  | "expired_proposals";

export type DashboardAlert = {
  kind: DashboardAlertKind;
  label: string;
  count: number;
  href: string;
  tone: "destructive" | "warning";
  hint?: string;
};

export type FinancialSnapshot = {
  bankCash: number;
  /** Diferencia con respecto al fin del mes anterior. */
  bankCashDeltaMonth: number;
  monthResult: {
    /** Net profit del mes en curso (ingresos - gastos operativos). */
    netProfit: number;
    /** Media netProfit de los 3 meses anteriores. */
    avg3m: number;
  };
  vatPiggyBank: number;
  /** Serie de últimos 6 meses (oldest first). */
  monthlySeries: Array<{ month: string; income: number; expense: number }>;
};

export type PipelineSnapshot = {
  totalOpen: number;
  /** Suma del importe de propuestas abiertas. */
  valueOpen: number;
  /** En negociación. */
  inNegotiation: number;
  /** % de propuestas ganadas vs cerradas. */
  winRate: number;
  /** Top clientes calientes. */
  hotClients: Array<{
    id: string;
    nombre: string;
    stage: "proposal" | "negotiation";
    estimated_ltv: number;
  }>;
};

export type DashboardGoal = OrganizationGoal & {
  progressPercent: number;
};

export type DashboardData = {
  currentUser: { id: string; name: string };
  alerts: DashboardAlert[];
  finance: FinancialSnapshot;
  pipeline: PipelineSnapshot;
  upcoming: CalendarEvent[];
  myTickets: TicketBoardItem[];
  goals: DashboardGoal[];
  activity: ActivityLogListItem[];
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfCurrentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

async function fetchUpcomingRenewalCount(daysAhead: number): Promise<number> {
  const supabase = await createClient();
  const today = todayISO();
  const upper = addDaysISO(today, daysAhead);
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("next_renewal", today)
    .lte("next_renewal", upper);
  if (error?.code === "PGRST205") return 0;
  if (error) throw error;
  return count ?? 0;
}

async function fetchOverdueRotationCount(): Promise<number> {
  const supabase = await createClient();
  const today = todayISO();
  const { count, error } = await supabase
    .from("credentials")
    .select("id", { count: "exact", head: true })
    .lt("rotation_due_on", today);
  if (error?.code === "PGRST205") return 0;
  if (error) throw error;
  return count ?? 0;
}

function computeFinancialSnapshot(
  bundle: Awaited<ReturnType<typeof getFinanceDataBundle>>
): FinancialSnapshot {
  const series = bundle.monthlySeries;
  const last6 = series.slice(-6);

  const trend = bundle.reports.monthlyTrend;
  const currentMonth = trend.length > 0 ? trend[trend.length - 1] : null;
  const previous3 = trend.slice(-4, -1);
  const avg3m =
    previous3.length > 0
      ? previous3.reduce((acc, m) => acc + (m.income - m.expense), 0) / previous3.length
      : 0;
  const netProfit = currentMonth ? currentMonth.income - currentMonth.expense : 0;

  const expensesThisMonth = bundle.expenses
    .filter((row) => row.issued_at >= startOfCurrentMonthISO())
    .reduce((acc, row) => acc + row.amount_total, 0);
  const incomesThisMonth = bundle.incomes
    .filter((row) => row.issued_at >= startOfCurrentMonthISO())
    .reduce((acc, row) => acc + row.amount_total, 0);
  const bankCashDeltaMonth = Number((incomesThisMonth - expensesThisMonth).toFixed(2));

  return {
    bankCash: bundle.treasury.bankCash,
    bankCashDeltaMonth,
    monthResult: {
      netProfit: Number(netProfit.toFixed(2)),
      avg3m: Number(avg3m.toFixed(2)),
    },
    vatPiggyBank: bundle.kpis.vatPiggyBank,
    monthlySeries: last6,
  };
}

function computePipelineSnapshot(proposals: ProposalListItem[]): PipelineSnapshot {
  const open = proposals.filter((p) =>
    ["draft", "sent", "in_review", "negotiation"].includes(p.status)
  );
  const valueOpen = open.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
  const inNegotiation = proposals.filter((p) => p.status === "negotiation").length;
  const won = proposals.filter((p) => p.status === "won").length;
  const closed = proposals.filter(
    (p) => p.status === "won" || p.status === "lost"
  ).length;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;

  return {
    totalOpen: open.length,
    valueOpen: Number(valueOpen.toFixed(2)),
    inNegotiation,
    winRate,
    hotClients: [],
  };
}

async function fetchHotClients(): Promise<PipelineSnapshot["hotClients"]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, nombre, stage, estimated_ltv")
    .in("stage", ["proposal", "negotiation"])
    .eq("activo", true)
    .order("estimated_ltv", { ascending: false })
    .limit(3);
  if (error?.code === "PGRST205") return [];
  if (error) throw error;
  return (data ?? []) as PipelineSnapshot["hotClients"];
}

function pickPriorityTickets(
  tickets: TicketBoardItem[],
  userId: string
): TicketBoardItem[] {
  const priorityWeight: Record<TicketBoardItem["priority"], number> = {
    fire: 3,
    high: 2,
    normal: 1,
  };
  return tickets
    .filter((t) => t.assignee_id === userId && t.status !== "done")
    .sort((a, b) => {
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (diff !== 0) return diff;
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);
}

function pickActiveGoals(
  goals: OrganizationGoal[],
  userId: string
): DashboardGoal[] {
  const enriched = goals.map((g) => {
    const target = Number(g.target_value || 0);
    const current = Number(g.current_value || 0);
    const progressPercent =
      target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
    return { ...g, progressPercent };
  });
  return enriched
    .filter((g) => g.progressPercent < 100)
    .sort((a, b) => {
      const aMine =
        a.scope === "personal" && a.owner_id === userId ? 0 : a.scope === "team" ? 1 : 2;
      const bMine =
        b.scope === "personal" && b.owner_id === userId ? 0 : b.scope === "team" ? 1 : 2;
      if (aMine !== bMine) return aMine - bMine;
      const aDate = a.target_date ?? "9999-12-31";
      const bDate = b.target_date ?? "9999-12-31";
      return aDate.localeCompare(bDate);
    })
    .slice(0, 4);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const today = todayISO();
  const sevenDaysAhead = addDaysISO(today, 7);

  const [
    financeBundle,
    proposals,
    hotClients,
    renewalsCount,
    rotationsCount,
    upcomingEvents,
    tickets,
    orgData,
    activity,
    teamMember,
  ] = await Promise.all([
    getFinanceDataBundle().catch(() => ({
      kpis: { netProfit: 0, operationalIncome: 0, operationalExpense: 0, vatPiggyBank: 0 },
      monthlySeries: [],
      latest: [],
      incomes: [],
      expenses: [],
      treasury: { bankCash: 0, partnerBalances: [] },
      categoryExpenseSeries: [],
      reports: {
        kpis: {
          avgMonthlyIncome: 0,
          avgMonthlyExpense: 0,
          avgMonthlyNet: 0,
          expenseVolatilityPct: 0,
          topExpenseCategoryPct: 0,
          internalMovementWeightPct: 0,
        },
        monthlyTrend: [],
        forecast3m: [],
        topExpenses: [],
      },
    })),
    listProposals(),
    fetchHotClients(),
    fetchUpcomingRenewalCount(7),
    fetchOverdueRotationCount(),
    listCalendarEvents(today, sevenDaysAhead, today),
    listTicketBoard(),
    getOrganizationDashboardData().catch(() => ({
      me: { id: user.id, email: user.email ?? null },
      goals: [] as OrganizationGoal[],
      members: [],
    })),
    listActivityLogs(12),
    supabase
      .from("team_members")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const myFires = tickets.filter(
    (t) =>
      t.priority === "fire" &&
      t.status !== "done" &&
      (t.assignee_id === user.id || t.assignee_id === null)
  ).length;

  const expiredProposals = proposals.filter(
    (p) =>
      p.valid_until &&
      p.valid_until < today &&
      ["draft", "sent", "in_review", "negotiation"].includes(p.status)
  ).length;

  const alerts: DashboardAlert[] = [];
  if (myFires > 0) {
    alerts.push({
      kind: "fires",
      label: myFires === 1 ? "1 ticket en fuego" : `${myFires} tickets en fuego`,
      count: myFires,
      href: "/tickets",
      tone: "destructive",
      hint: "Asignado a ti o sin asignar",
    });
  }
  if (rotationsCount > 0) {
    alerts.push({
      kind: "rotations",
      label:
        rotationsCount === 1
          ? "1 credencial sin rotar"
          : `${rotationsCount} credenciales sin rotar`,
      count: rotationsCount,
      href: "/boveda",
      tone: "warning",
      hint: "Rotación vencida",
    });
  }
  if (renewalsCount > 0) {
    alerts.push({
      kind: "renewals",
      label:
        renewalsCount === 1
          ? "1 suscripción se renueva"
          : `${renewalsCount} suscripciones se renuevan`,
      count: renewalsCount,
      href: "/calendario",
      tone: "warning",
      hint: "En los próximos 7 días",
    });
  }
  if (expiredProposals > 0) {
    alerts.push({
      kind: "expired_proposals",
      label:
        expiredProposals === 1
          ? "1 propuesta caducada"
          : `${expiredProposals} propuestas caducadas`,
      count: expiredProposals,
      href: "/propuestas",
      tone: "warning",
      hint: "Aún en negociación tras fecha de validez",
    });
  }

  const finance = computeFinancialSnapshot(financeBundle);
  const pipelineBase = computePipelineSnapshot(proposals);
  const pipeline: PipelineSnapshot = { ...pipelineBase, hotClients };

  const upcoming = upcomingEvents
    .filter((event) => event.status !== "paid" && event.is_done !== true)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const myTickets = pickPriorityTickets(tickets, user.id);
  const goals = pickActiveGoals(orgData.goals, user.id);

  const teamRow = (teamMember.data ?? null) as
    | { full_name: string | null; email: string | null }
    | null;
  const currentUserName =
    teamRow?.full_name?.trim() ||
    teamRow?.email ||
    user.email ||
    "Compañero";

  return {
    currentUser: { id: user.id, name: currentUserName },
    alerts,
    finance,
    pipeline,
    upcoming,
    myTickets,
    goals,
    activity,
  };
}

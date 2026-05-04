import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DashboardBlock = {
  key:
    | "fires"
    | "proposals"
    | "invoices"
    | "deadlines"
    | "deviations";
  label: string;
  value: number;
  href: string;
};

export type DashboardFocusData = {
  urgentTickets: Array<{
    id: string;
    title: string;
    priority: "normal" | "high" | "fire";
    due_date: string | null;
  }>;
  hotClients: Array<{
    id: string;
    nombre: string;
    stage: "proposal" | "negotiation";
    estimated_ltv: number;
  }>;
};

type Scope = "personal" | "global";

function countWhenAvailable(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function isMissingRelationError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205";
}

export async function getDashboardBlocks(scope: Scope): Promise<DashboardBlock[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  const [ticketsFire, proposals, invoices, personalDeadlines, globalDeadlines, deviations] =
    await Promise.all([
    scope === "personal" && userId
      ? supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("priority", "fire")
          .neq("status", "done")
          .eq("assignee_id", userId)
      : supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("priority", "fire")
          .neq("status", "done"),
    supabase.from("vw_unanswered_proposals").select("total").maybeSingle(),
    supabase.from("vw_pending_invoices").select("total").maybeSingle(),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .not("due_date", "is", null)
      .lte("due_date", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
      .gte("due_date", new Date().toISOString().slice(0, 10))
      .eq("assignee_id", userId ?? "")
      .neq("status", "done"),
    supabase.from("vw_upcoming_deadlines").select("total").maybeSingle(),
    supabase.from("vw_projects_at_risk").select("total").maybeSingle(),
    ]);

  const safeProposals = isMissingRelationError(proposals.error)
    ? 0
    : countWhenAvailable(proposals.data?.total);
  const safeInvoices = isMissingRelationError(invoices.error)
    ? 0
    : countWhenAvailable(invoices.data?.total);
  const safeGlobalDeadlines = isMissingRelationError(globalDeadlines.error)
    ? 0
    : countWhenAvailable(globalDeadlines.data?.total);
  const safeDeviations = isMissingRelationError(deviations.error)
    ? 0
    : countWhenAvailable(deviations.data?.total);
  const safeFires = isMissingRelationError(ticketsFire.error)
    ? 0
    : countWhenAvailable(ticketsFire.count);
  const safePersonalDeadlines = isMissingRelationError(personalDeadlines.error)
    ? 0
    : countWhenAvailable(personalDeadlines.count);

  return [
    {
      key: "fires",
      label: "Fuegos activos",
      value: safeFires,
      href: "/tickets?priority=fire",
    },
    {
      key: "proposals",
      label: "Propuestas sin respuesta",
      value: safeProposals,
      href: "/propuestas",
    },
    {
      key: "invoices",
      label: "Facturas pendientes",
      value: safeInvoices,
      href: "/finanzas",
    },
    {
      key: "deadlines",
      label: "Vencimientos próximos",
      value: scope === "personal" ? safePersonalDeadlines : safeGlobalDeadlines,
      href: "/calendario",
    },
    {
      key: "deviations",
      label: "Proyectos en desvío",
      value: safeDeviations,
      href: "/rentabilidad",
    },
  ];
}

export async function getDashboardFocusData(): Promise<DashboardFocusData> {
  const supabase = await createClient();

  const [urgentTicketsRes, hotClientsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, title, priority, due_date")
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("clients")
      .select("id, nombre, stage, estimated_ltv")
      .in("stage", ["proposal", "negotiation"])
      .eq("activo", true)
      .order("estimated_ltv", { ascending: false })
      .limit(5),
  ]);

  if (urgentTicketsRes.error && !isMissingRelationError(urgentTicketsRes.error)) {
    throw urgentTicketsRes.error;
  }
  if (hotClientsRes.error && !isMissingRelationError(hotClientsRes.error)) {
    throw hotClientsRes.error;
  }

  const ticketPriorityWeight: Record<"normal" | "high" | "fire", number> = {
    normal: 1,
    high: 2,
    fire: 3,
  };

  const urgentTickets = ((urgentTicketsRes.data ?? []) as Array<{
    id: string;
    title: string;
    priority: "normal" | "high" | "fire";
    due_date: string | null;
  }>)
    .sort((a, b) => {
      const priorityDiff = ticketPriorityWeight[b.priority] - ticketPriorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  const hotClients = (hotClientsRes.data ?? []) as Array<{
    id: string;
    nombre: string;
    stage: "proposal" | "negotiation";
    estimated_ltv: number;
  }>;

  return { urgentTickets, hotClients };
}

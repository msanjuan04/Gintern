import "server-only";

import { createClient } from "@/lib/supabase/server";
import { listProfitabilityRows } from "@/lib/rentabilidad/queries";

type BillingPeriod = "monthly" | "quarterly" | "annual";
type ExpenseCategory = "saas" | "estructural" | "variable";

type MovementRow = {
  id: string;
  tipo: "income" | "expense";
  fecha: string;
  concepto: string;
  base_imponible: number;
  total: number;
  client_id: string | null;
  cobrado: boolean;
  fecha_cobro: string | null;
  attachment_path: string | null;
  client: { nombre: string | null } | null;
};

export type FinanceTableRow = {
  id: string;
  date: string;
  concept: string;
  clientName: string | null;
  amountNet: number;
  amountTotal: number;
  paid: boolean;
  paidDate: string | null;
  attachmentPath: string | null;
  attachmentUrl: string | null;
};

export type FinanceDashboardData = {
  overview: {
    netProfitYtd: number;
    cashflow: number;
    pendingDebt: number;
    mrrAssured: number;
    monthlySeries: Array<{ month: string; income: number; expense: number; margin: number }>;
    forecast: Array<{ month: string; expectedCash: number }>;
  };
  incomes: {
    aging: Array<{ id: string; clientName: string; amountNet: number; days: number }>;
    rows: FinanceTableRow[];
  };
  expenses: {
    burnRate: number;
    categorySeries: Array<{ category: ExpenseCategory; value: number }>;
    rows: FinanceTableRow[];
  };
  analytics: {
    profitabilityAverage: number;
    bestClient: { name: string; margin: number } | null;
    worstClient: { name: string; margin: number } | null;
    runwayMonths: number;
    marginGrowth: Array<{ month: string; margin: number }>;
  };
  splitter: {
    partnerCount: number;
    defaultSharePct: number;
  };
};

export type SubscriptionListItem = {
  id: string;
  name: string;
  provider: string;
  amount: number;
  billing_period: "monthly" | "quarterly" | "annual";
  next_renewal: string | null;
  is_active: boolean;
};

function toMonthlyAmount(amount: number, period: BillingPeriod) {
  if (period === "monthly") return amount;
  if (period === "quarterly") return amount / 3;
  return amount / 12;
}

function isMissingRelationError(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205";
}

export async function listSubscriptions(): Promise<SubscriptionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, name, provider, amount, billing_period, next_renewal, is_active")
    .order("is_active", { ascending: false })
    .order("next_renewal", { ascending: true, nullsFirst: false });

  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }

  return (data ?? []) as SubscriptionListItem[];
}

function classifyExpense(concept: string): ExpenseCategory {
  const c = concept.toLowerCase();
  if (
    c.includes("figma") ||
    c.includes("vercel") ||
    c.includes("notion") ||
    c.includes("openai") ||
    c.includes("saas") ||
    c.includes("licencia")
  ) {
    return "saas";
  }
  if (
    c.includes("alquiler") ||
    c.includes("nomina") ||
    c.includes("asesoria") ||
    c.includes("seguro") ||
    c.includes("fijo")
  ) {
    return "estructural";
  }
  return "variable";
}

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelFromKey(key: string) {
  const [y, m] = key.split("-");
  const month = Number(m);
  const short = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][month - 1];
  return `${short} ${y.slice(-2)}`;
}

async function resolveAttachmentUrls(rows: FinanceTableRow[]) {
  const supabase = await createClient();
  const paths = rows
    .map((row) => row.attachmentPath)
    .filter((value): value is string => Boolean(value));
  if (paths.length === 0) return rows;

  const { data: signed } = await supabase.storage.from("invoices").createSignedUrls(paths, 3600);
  const urlByPath = new Map<string, string>();
  for (const item of signed ?? []) {
    if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
  }
  return rows.map((row) => ({
    ...row,
    attachmentUrl: row.attachmentPath ? urlByPath.get(row.attachmentPath) ?? null : null,
  }));
}

export async function getFinanceDashboardData(): Promise<FinanceDashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const decemberPrevYear = `${currentYear - 1}-12-01`;

  const [movementsRes, subscriptionsRes, profitabilityRows] = await Promise.all([
    supabase
      .from("movements")
      .select(
        "id, tipo, fecha, concepto, base_imponible, total, client_id, cobrado, fecha_cobro, attachment_path, client:clients(nombre)"
      )
      .eq("scope", "gnerai")
      .order("fecha", { ascending: true }),
    listSubscriptions(),
    listProfitabilityRows(),
  ]);

  if (movementsRes.error && !isMissingRelationError(movementsRes.error)) {
    throw movementsRes.error;
  }

  const rows = (movementsRes.data ?? []) as unknown as MovementRow[];
  const sinceDecemberRows = rows.filter((row) => row.fecha >= decemberPrevYear);
  const ytdRows = rows.filter((row) => row.fecha.startsWith(`${currentYear}`));
  const todayIso = new Date().toISOString().slice(0, 10);

  const monthlyMap = new Map<string, { income: number; expense: number; margin: number }>();
  for (const row of sinceDecemberRows) {
    const key = monthKey(new Date(`${row.fecha}T00:00:00`));
    const current = monthlyMap.get(key) ?? { income: 0, expense: 0, margin: 0 };
    const net = Number(row.base_imponible ?? 0);
    if (row.tipo === "income") current.income += net;
    if (row.tipo === "expense") current.expense += net;
    current.margin = current.income - current.expense;
    monthlyMap.set(key, current);
  }

  const activeSubscriptions = subscriptionsRes.filter((s) => s.is_active);
  const fixedSaasMonthly = activeSubscriptions.reduce(
    (acc, item) => acc + toMonthlyAmount(Number(item.amount), item.billing_period),
    0
  );

  const monthlySeries = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: monthLabelFromKey(key),
      income: Number(value.income.toFixed(2)),
      expense: Number(value.expense.toFixed(2)),
      margin: Number(value.margin.toFixed(2)),
    }));

  const incomeRowsRaw: FinanceTableRow[] = rows
    .filter((row) => row.tipo === "income")
    .map((row) => ({
      id: row.id,
      date: row.fecha,
      concept: row.concepto,
      clientName: row.client?.nombre ?? null,
      amountNet: Number(row.base_imponible ?? 0),
      amountTotal: Number(row.total ?? 0),
      paid: row.cobrado,
      paidDate: row.fecha_cobro,
      attachmentPath: row.attachment_path,
      attachmentUrl: null,
    }));
  const expenseRowsRaw: FinanceTableRow[] = rows
    .filter((row) => row.tipo === "expense")
    .map((row) => ({
      id: row.id,
      date: row.fecha,
      concept: row.concepto,
      clientName: row.client?.nombre ?? null,
      amountNet: Number(row.base_imponible ?? 0),
      amountTotal: Number(row.total ?? 0),
      paid: row.cobrado,
      paidDate: row.fecha_cobro,
      attachmentPath: row.attachment_path,
      attachmentUrl: null,
    }));

  const [incomeRows, expenseRows] = await Promise.all([
    resolveAttachmentUrls(incomeRowsRaw),
    resolveAttachmentUrls(expenseRowsRaw),
  ]);

  const pendingDebt = incomeRows
    .filter((row) => !row.paid)
    .reduce((acc, row) => acc + row.amountNet, 0);
  const cashflow = rows.reduce((acc, row) => {
    const net = Number(row.base_imponible ?? 0);
    if (row.tipo === "income" && row.cobrado) return acc + net;
    if (row.tipo === "expense") return acc - net;
    return acc;
  }, 0);
  const netProfitYtd = ytdRows.reduce((acc, row) => {
    const net = Number(row.base_imponible ?? 0);
    return row.tipo === "income" ? acc + net : acc - net;
  }, 0);

  const mrrIncomeRows = rows.filter(
    (row) =>
      row.tipo === "income" &&
      (row.concepto.toLowerCase().includes("mantenimiento") ||
        row.concepto.toLowerCase().includes("retainer") ||
        row.concepto.toLowerCase().includes("mensual"))
  );
  const mrrAssured =
    mrrIncomeRows.length > 0
      ? mrrIncomeRows.reduce((acc, row) => acc + Number(row.base_imponible ?? 0), 0) /
        Math.max(1, new Set(mrrIncomeRows.map((row) => row.fecha.slice(0, 7))).size)
      : 0;

  const monthExpenseMap = new Map<string, number>();
  for (const row of rows.filter((r) => r.tipo === "expense")) {
    const key = row.fecha.slice(0, 7);
    monthExpenseMap.set(key, (monthExpenseMap.get(key) ?? 0) + Number(row.base_imponible ?? 0));
  }
  const burnRate =
    monthExpenseMap.size > 0
      ? Array.from(monthExpenseMap.values()).reduce((a, b) => a + b, 0) / monthExpenseMap.size
      : 0;

  const nowDate = new Date();
  const forecastBase = cashflow;
  const monthlyDelta = mrrAssured - burnRate - fixedSaasMonthly;
  const forecast = [1, 2, 3].map((n) => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() + n, 1);
    const key = monthKey(d);
    return {
      month: monthLabelFromKey(key),
      expectedCash: Number((forecastBase + monthlyDelta * n).toFixed(2)),
    };
  });

  const aging = incomeRows
    .filter((row) => !row.paid)
    .map((row) => {
      const days = Math.max(
        0,
        Math.floor(
          (new Date(`${todayIso}T00:00:00`).getTime() -
            new Date(`${row.date}T00:00:00`).getTime()) /
            86400000
        )
      );
      return {
        id: row.id,
        clientName: row.clientName ?? "Sin cliente",
        amountNet: row.amountNet,
        days,
      };
    })
    .sort((a, b) => b.days - a.days)
    .slice(0, 8);

  const categoryMap = new Map<ExpenseCategory, number>([
    ["saas", 0],
    ["estructural", 0],
    ["variable", 0],
  ]);
  for (const row of expenseRows) {
    const category = classifyExpense(row.concept);
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + row.amountNet);
  }
  const categorySeries = Array.from(categoryMap.entries()).map(([category, value]) => ({
    category,
    value: Number(value.toFixed(2)),
  }));

  const clientMarginMap = new Map<string, { name: string; margin: number }>();
  for (const row of rows) {
    if (!row.client_id) continue;
    const name = row.client?.nombre ?? "Sin cliente";
    const current = clientMarginMap.get(row.client_id) ?? { name, margin: 0 };
    const net = Number(row.base_imponible ?? 0);
    current.margin += row.tipo === "income" ? net : -net;
    clientMarginMap.set(row.client_id, current);
  }
  const clientRanking = Array.from(clientMarginMap.values()).sort(
    (a, b) => b.margin - a.margin
  );

  const profitabilityAverage =
    profitabilityRows.length > 0
      ? profitabilityRows.reduce((acc, row) => acc + row.eur_per_hour, 0) /
        profitabilityRows.length
      : 0;

  const runwayMonths =
    burnRate + fixedSaasMonthly > 0 ? cashflow / (burnRate + fixedSaasMonthly) : 0;

  return {
    overview: {
      netProfitYtd: Number(netProfitYtd.toFixed(2)),
      cashflow: Number(cashflow.toFixed(2)),
      pendingDebt: Number(pendingDebt.toFixed(2)),
      mrrAssured: Number(mrrAssured.toFixed(2)),
      monthlySeries,
      forecast,
    },
    incomes: {
      aging,
      rows: incomeRows.slice().sort((a, b) => b.date.localeCompare(a.date)),
    },
    expenses: {
      burnRate: Number(burnRate.toFixed(2)),
      categorySeries,
      rows: expenseRows.slice().sort((a, b) => b.date.localeCompare(a.date)),
    },
    analytics: {
      profitabilityAverage: Number(profitabilityAverage.toFixed(2)),
      bestClient: clientRanking[0] ?? null,
      worstClient: clientRanking[clientRanking.length - 1] ?? null,
      runwayMonths: Number(runwayMonths.toFixed(1)),
      marginGrowth: monthlySeries.map((row) => ({ month: row.month, margin: row.margin })),
    },
    splitter: {
      partnerCount: 5,
      defaultSharePct: 20,
    },
  };
}

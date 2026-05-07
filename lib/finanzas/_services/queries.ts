import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TransactionType = "income" | "expense";
export type TransactionCategory =
  | "saas"
  | "structural"
  | "variable"
  | "service"
  | "uncategorized"
  | "internal_movement";

export type TransactionRow = {
  id: string;
  concept: string;
  type: TransactionType;
  category: TransactionCategory;
  amount_net: number;
  tax_amount: number;
  amount_total: number;
  issued_at: string;
  paid_at: string | null;
  client_id: string | null;
  project_id: string | null;
  invoice_file_path: string | null;
  created_by: string;
  client: { nombre: string | null } | null;
};

export type FinanceKpis = {
  netProfit: number;
  operationalIncome: number;
  operationalExpense: number;
  vatPiggyBank: number;
};

export type FinanceMonthlyPoint = {
  month: string;
  income: number;
  expense: number;
};

export type FinanceDataBundle = {
  kpis: FinanceKpis;
  monthlySeries: FinanceMonthlyPoint[];
  latest: TransactionRow[];
  incomes: TransactionRow[];
  expenses: TransactionRow[];
  treasury: {
    bankCash: number;
    partnerBalances: Array<{
      partnerId: string;
      partnerName: string;
      withdrawnAmount: number;
      injectedAmount: number;
      netAmount: number;
      movementCount: number;
    }>;
  };
  categoryExpenseSeries: Array<{ category: "saas" | "structural" | "variable"; value: number }>;
  reports: {
    kpis: {
      avgMonthlyIncome: number;
      avgMonthlyExpense: number;
      avgMonthlyNet: number;
      expenseVolatilityPct: number;
      topExpenseCategoryPct: number;
      internalMovementWeightPct: number;
    };
    monthlyTrend: Array<{ month: string; income: number; expense: number; net: number }>;
    forecast3m: Array<{ month: string; expectedIncome: number; expectedExpense: number; expectedNet: number }>;
    topExpenses: Array<{ concept: string; amount: number; issuedAt: string; category: string }>;
  };
};

function monthLabel(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

export async function listClientsForFilter() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFinanceDataBundle(): Promise<FinanceDataBundle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, concept, type, category, amount_net, tax_amount, amount_total, issued_at, paid_at, client_id, project_id, invoice_file_path, created_by, client:clients(nombre)"
    )
    .order("issued_at", { ascending: false });

  if (error) throw error;

  const rows = ((data ?? []) as unknown as TransactionRow[]).map((row) => ({
    ...row,
    amount_net: Number(row.amount_net ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    amount_total: Number(row.amount_total ?? 0),
  }));

  const partnerDirectory = await listPartnersForTreasury(supabase);

  const operational = rows.filter((row) => row.category !== "internal_movement");
  const operationalIncome = operational
    .filter((row) => row.type === "income")
    .reduce((acc, row) => acc + row.amount_net, 0);
  const operationalExpense = operational
    .filter((row) => row.type === "expense")
    .reduce((acc, row) => acc + row.amount_net, 0);
  const netProfit = operationalIncome - operationalExpense;

  const vatIncome = rows
    .filter((row) => row.type === "income" && row.paid_at !== null)
    .reduce((acc, row) => acc + row.tax_amount, 0);
  const vatExpense = rows
    .filter((row) => row.type === "expense" && row.paid_at !== null)
    .reduce((acc, row) => acc + row.tax_amount, 0);
  const vatPiggyBank = vatIncome - vatExpense;

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const row of operational) {
    const key = row.issued_at.slice(0, 7);
    const value = monthMap.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "income") value.income += row.amount_net;
    if (row.type === "expense") value.expense += row.amount_net;
    monthMap.set(key, value);
  }
  const monthlySeries = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: monthLabel(`${key}-01`),
      income: Number(value.income.toFixed(2)),
      expense: Number(value.expense.toFixed(2)),
    }));

  const categoryExpenseSeries = (["saas", "structural", "variable"] as const).map((category) => ({
    category,
    value: Number(
      operational
        .filter((row) => row.type === "expense" && row.category === category)
        .reduce((acc, row) => acc + row.amount_net, 0)
        .toFixed(2)
    ),
  }));

  const treasury = getTreasuryDistribution(rows, partnerDirectory);
  const reports = getReportsData(rows, operational);

  return {
    kpis: {
      netProfit: Number(netProfit.toFixed(2)),
      operationalIncome: Number(operationalIncome.toFixed(2)),
      operationalExpense: Number(operationalExpense.toFixed(2)),
      vatPiggyBank: Number(vatPiggyBank.toFixed(2)),
    },
    monthlySeries,
    latest: rows.slice(0, 10),
    incomes: rows.filter((row) => row.type === "income"),
    expenses: rows.filter((row) => row.type === "expense"),
    treasury,
    categoryExpenseSeries,
    reports,
  };
}

type TreasuryPartnerDirectoryRow = {
  id: string;
  displayName: string;
  matchTokens: string[];
};

async function listPartnersForTreasury(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<TreasuryPartnerDirectoryRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, nombre, apellidos, role")
    .eq("role", "socio")
    .order("nombre", { ascending: true });

  if (error?.code === "PGRST205") return [];
  if (error) throw error;

  return (data ?? []).map((row) => {
    const fullName = [row.nombre, row.apellidos].filter(Boolean).join(" ").trim();
    const displayName = fullName || row.email || "Socio";
    const tokens = buildMatchTokens({
      nombre: row.nombre ?? "",
      apellidos: row.apellidos ?? "",
      fullName,
      email: row.email ?? "",
    });
    return {
      id: row.id,
      displayName,
      matchTokens: Array.from(tokens),
    };
  });
}

export function getTreasuryDistribution(
  rows: TransactionRow[],
  partners: TreasuryPartnerDirectoryRow[]
) {
  const bankIncome = rows
    .filter((row) => row.type === "income")
    .reduce((acc, row) => acc + row.amount_total, 0);
  const bankExpense = rows
    .filter((row) => row.type === "expense")
    .reduce((acc, row) => acc + row.amount_total, 0);
  const bankCash = Number((bankIncome - bankExpense).toFixed(2));

  const internal = rows.filter((row) => row.category === "internal_movement");

  const base = new Map<
    string,
    {
      partnerId: string;
      partnerName: string;
      withdrawnAmount: number;
      injectedAmount: number;
      movementCount: number;
    }
  >();
  for (const partner of partners) {
    base.set(partner.id, {
      partnerId: partner.id,
      partnerName: partner.displayName,
      withdrawnAmount: 0,
      injectedAmount: 0,
      movementCount: 0,
    });
  }

  for (const row of internal) {
    const matchedPartnerId = matchPartnerForRow(row, partners);
    if (!matchedPartnerId) continue;
    const bucket = base.get(matchedPartnerId);
    if (!bucket) continue;
    if (row.type === "expense") bucket.withdrawnAmount += row.amount_total;
    if (row.type === "income") bucket.injectedAmount += row.amount_total;
    bucket.movementCount += 1;
  }

  const partnerBalances = Array.from(base.values())
    .map((row) => ({
      ...row,
      withdrawnAmount: Number(row.withdrawnAmount.toFixed(2)),
      injectedAmount: Number(row.injectedAmount.toFixed(2)),
      netAmount: Number((row.withdrawnAmount - row.injectedAmount).toFixed(2)),
    }))
    .sort((a, b) => b.netAmount - a.netAmount);

  return { bankCash, partnerBalances };
}

function tokenize(value: string) {
  const STOPWORDS = new Set([
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "y",
    "da",
    "do",
    "dos",
  ]);

  return normalize(value)
    .split(/\s+|[._\-@]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

function buildMatchTokens({
  nombre,
  apellidos,
  fullName,
  email,
}: {
  nombre: string;
  apellidos: string;
  fullName: string;
  email: string;
}) {
  const tokens = new Set<string>();

  for (const value of [nombre, apellidos, fullName]) {
    for (const token of tokenize(value)) {
      tokens.add(token);
      if (token.length >= 5) tokens.add(token.slice(0, 5));
    }
  }

  const local = normalize(email.split("@")[0] ?? "");
  if (local) {
    tokens.add(local);
    if (local.length >= 5) tokens.add(local.slice(0, 5));
    // Caso típico: "msanjuan" -> "sanjuan" y "sanju"
    if (/^[a-z][a-z]{5,}$/.test(local)) {
      const withoutFirst = local.slice(1);
      tokens.add(withoutFirst);
      if (withoutFirst.length >= 5) tokens.add(withoutFirst.slice(0, 5));
    }
  }

  // Alias manuales para nombres usados en movimientos internos legacy.
  if (tokens.has("sanjuan")) tokens.add("sanju");
  if (tokens.has("martinez")) tokens.add("jmartinez");
  if (tokens.has("lago")) tokens.add("hlago");
  if (tokens.has("sostres")) tokens.add("asostres");

  return tokens;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchPartnerForRow(
  row: TransactionRow,
  partners: TreasuryPartnerDirectoryRow[]
): string | null {
  const concept = normalize(row.concept);
  let best: { id: string; score: number } | null = null;
  for (const partner of partners) {
    let score = 0;
    for (const token of partner.matchTokens) {
      if (token.length < 4) continue;
      const bounded = new RegExp(`(^|[^a-z0-9])${escapeForRegExp(token)}([^a-z0-9]|$)`, "i");
      if (bounded.test(concept)) score += token.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id: partner.id, score };
    }
  }
  return best?.id ?? null;
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function monthKey(dateIso: string) {
  return dateIso.slice(0, 7);
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
}

function addMonths(key: string, months: number) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1 + months, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getReportsData(rows: TransactionRow[], operational: TransactionRow[]) {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const row of operational) {
    const key = monthKey(row.issued_at);
    const current = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (row.type === "income") current.income += row.amount_net;
    if (row.type === "expense") current.expense += row.amount_net;
    byMonth.set(key, current);
  }

  const monthlyTrend = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: monthLabelFromKey(key),
      income: Number(value.income.toFixed(2)),
      expense: Number(value.expense.toFixed(2)),
      net: Number((value.income - value.expense).toFixed(2)),
    }));

  const incomes = monthlyTrend.map((m) => m.income);
  const expenses = monthlyTrend.map((m) => m.expense);
  const nets = monthlyTrend.map((m) => m.net);

  const avgMonthlyIncome =
    incomes.length > 0 ? Number((incomes.reduce((a, b) => a + b, 0) / incomes.length).toFixed(2)) : 0;
  const avgMonthlyExpense =
    expenses.length > 0 ? Number((expenses.reduce((a, b) => a + b, 0) / expenses.length).toFixed(2)) : 0;
  const avgMonthlyNet =
    nets.length > 0 ? Number((nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(2)) : 0;
  const expenseVolatilityPct =
    avgMonthlyExpense > 0 ? Number(((stdDev(expenses) / avgMonthlyExpense) * 100).toFixed(2)) : 0;

  const operationalExpenses = operational.filter((row) => row.type === "expense");
  const expenseByCategory = new Map<string, number>();
  for (const row of operationalExpenses) {
    expenseByCategory.set(row.category, (expenseByCategory.get(row.category) ?? 0) + row.amount_net);
  }
  const totalOperationalExpense = operationalExpenses.reduce((acc, row) => acc + row.amount_net, 0);
  const topExpenseCategoryAmount = Math.max(0, ...Array.from(expenseByCategory.values()));
  const topExpenseCategoryPct =
    totalOperationalExpense > 0
      ? Number(((topExpenseCategoryAmount / totalOperationalExpense) * 100).toFixed(2))
      : 0;

  const internalAmount = rows
    .filter((row) => row.category === "internal_movement")
    .reduce((acc, row) => acc + row.amount_total, 0);
  const totalAmount = rows.reduce((acc, row) => acc + row.amount_total, 0);
  const internalMovementWeightPct =
    totalAmount > 0 ? Number(((internalAmount / totalAmount) * 100).toFixed(2)) : 0;

  const lastMonthKey =
    Array.from(byMonth.keys()).sort((a, b) => a.localeCompare(b)).slice(-1)[0] ?? monthKey(new Date().toISOString());
  const forecast3m = [1, 2, 3].map((idx) => {
    const key = addMonths(lastMonthKey, idx);
    return {
      month: monthLabelFromKey(key),
      expectedIncome: avgMonthlyIncome,
      expectedExpense: avgMonthlyExpense,
      expectedNet: Number((avgMonthlyIncome - avgMonthlyExpense).toFixed(2)),
    };
  });

  const topExpenses = operationalExpenses
    .slice()
    .sort((a, b) => b.amount_net - a.amount_net)
    .slice(0, 6)
    .map((row) => ({
      concept: row.concept,
      amount: Number(row.amount_net.toFixed(2)),
      issuedAt: row.issued_at,
      category: row.category,
    }));

  return {
    kpis: {
      avgMonthlyIncome,
      avgMonthlyExpense,
      avgMonthlyNet,
      expenseVolatilityPct,
      topExpenseCategoryPct,
      internalMovementWeightPct,
    },
    monthlyTrend,
    forecast3m,
    topExpenses,
  };
}


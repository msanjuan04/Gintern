import "server-only";

import { createClient } from "@/lib/supabase/server";

export type BalanceEstado = "verde" | "ambar" | "rojo";

export type BalanceRow = {
  user_id: string;
  user_nombre: string;
  aportacion_neta: number;
  delta_vs_otro: number;
  compensacion_sugerida: number;
  estado: BalanceEstado;
};

export function currentQuarter() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    quarter: Math.floor(now.getMonth() / 3) + 1,
  };
}

export function quarterRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const endDate = new Date(year, endMonth, 0);
  const end = `${year}-${String(endMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

export async function getBalanceActual(
  year?: number,
  quarter?: number
): Promise<BalanceRow[]> {
  const cur = currentQuarter();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_balance_actual", {
    p_year: year ?? cur.year,
    p_quarter: quarter ?? cur.quarter,
  });
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    user_id: String(row.user_id),
    user_nombre: String(row.user_nombre),
    aportacion_neta: Number(row.aportacion_neta),
    delta_vs_otro: Number(row.delta_vs_otro),
    compensacion_sugerida: Number(row.compensacion_sugerida),
    estado: (row.estado ?? "verde") as BalanceEstado,
  }));
}

export type Compensacion = {
  emisor: BalanceRow; // el que ha aportado MENOS y debería emitir factura
  receptor: BalanceRow; // el que ha aportado MÁS
  importe: number; // |delta| / 2 (en positivo)
  estado: BalanceEstado;
};

export function getCompensacionEntreSocios(
  balances: BalanceRow[]
): Compensacion | null {
  if (balances.length !== 2) return null;
  const sorted = [...balances].sort(
    (x, y) => y.aportacion_neta - x.aportacion_neta
  );
  const [a, b] = sorted;
  const importe = Number(((a.aportacion_neta - b.aportacion_neta) / 2).toFixed(2));
  if (importe <= 0) return null;
  return {
    emisor: b,
    receptor: a,
    importe,
    estado: balances[0].estado,
  };
}

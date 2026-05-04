/**
 * Inserta una transacción en public.transactions usando la service role.
 * Uso: node --env-file=.env.local scripts/insert-finanzas-transaction.mjs
 *
 * Idempotente: si ya existe misma concepto + issued_at + importes, no duplica.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const row = {
  concept: "Claude",
  type: "expense",
  category: "saas",
  amount_net: 38.25,
  tax_amount: 0,
  amount_total: 38.25,
  issued_at: "2026-05-04",
  paid_at: "2026-05-04",
};

async function main() {
  const { data: existing, error: selErr } = await supabase
    .from("transactions")
    .select("id")
    .eq("concept", row.concept)
    .eq("issued_at", row.issued_at)
    .eq("type", row.type)
    .eq("amount_total", row.amount_total)
    .limit(1)
    .maybeSingle();

  if (selErr) {
    console.error("Consulta:", selErr.message);
    process.exit(1);
  }
  if (existing?.id) {
    console.log("Ya existe la transacción (id:", existing.id, "). Nada que hacer.");
    return;
  }

  const { data: admin, error: adminErr } = await supabase
    .from("team_members")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (adminErr || !admin?.id) {
    console.error("No se pudo resolver admin activo:", adminErr?.message ?? "sin filas");
    process.exit(1);
  }

  const { data: inserted, error: insErr } = await supabase
    .from("transactions")
    .insert({ ...row, created_by: admin.id })
    .select("id")
    .single();

  if (insErr) {
    console.error("Insert:", insErr.message);
    process.exit(1);
  }

  console.log("Insertada transacción", inserted.id);
}

main();

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import {
  calculateMovementTotal,
  movementSchema,
  type MovementInput,
} from "./schema";

export type MovementFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function num(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function parseFormData(formData: FormData): MovementInput {
  return movementSchema.parse({
    tipo: String(formData.get("tipo") ?? "income"),
    scope: String(formData.get("scope") ?? "gnerai"),
    fecha: String(formData.get("fecha") ?? ""),
    concepto: String(formData.get("concepto") ?? ""),
    base_imponible: num(formData.get("base_imponible")),
    iva_amount: num(formData.get("iva_amount"), 0),
    irpf_amount: num(formData.get("irpf_amount"), 0),
    client_id: formData.get("client_id")
      ? String(formData.get("client_id"))
      : null,
    cobrado:
      formData.get("cobrado") === "on" || formData.get("cobrado") === "true",
    fecha_cobro: formData.get("fecha_cobro")
      ? String(formData.get("fecha_cobro"))
      : null,
    notas: formData.get("notas") ? String(formData.get("notas")) : undefined,
  });
}

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export async function createMovementAction(
  _prev: MovementFormState,
  formData: FormData
): Promise<MovementFormState> {
  let input: MovementInput;
  try {
    input = parseFormData(formData);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        status: "error",
        message: "Revisa los campos marcados.",
        fieldErrors: toFieldErrors(e),
      };
    }
    throw e;
  }

  const total = calculateMovementTotal(input);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supabase.from("movements").insert({
    user_id: user.id,
    invoice_id: null,
    tipo: input.tipo,
    scope: input.scope,
    fecha: input.fecha,
    base_imponible: input.base_imponible,
    iva_amount: input.iva_amount,
    irpf_amount: input.irpf_amount,
    total,
    concepto: input.concepto,
    client_id: input.client_id,
    cobrado: input.cobrado,
    fecha_cobro: input.fecha_cobro,
  });

  if (error) return { status: "error", message: error.message };

  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidatePath("/balance");
  redirect("/movimientos");
}

export async function toggleMovementCobradoAction(
  id: string,
  cobrado: boolean,
  fechaCobro?: string
) {
  const supabase = createClient();
  const update: Record<string, unknown> = { cobrado };
  if (cobrado) {
    update.fecha_cobro =
      fechaCobro ?? new Date().toISOString().slice(0, 10);
  } else {
    update.fecha_cobro = null;
  }
  const { error } = await supabase
    .from("movements")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidatePath("/balance");
}

export async function deleteMovementAction(id: string) {
  const supabase = createClient();
  // No permitimos borrar movimientos generados desde una factura
  const { data: existing } = await supabase
    .from("movements")
    .select("invoice_id")
    .eq("id", id)
    .maybeSingle();
  if (existing?.invoice_id) {
    throw new Error(
      "Este movimiento viene de una factura. Anula la factura para eliminarlo."
    );
  }
  const { error } = await supabase.from("movements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidatePath("/balance");
}

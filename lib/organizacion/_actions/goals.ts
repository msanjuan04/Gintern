"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const createGoalSchema = z.object({
  title: z.string().min(3, "Titulo obligatorio."),
  description: z.string().max(4000).optional(),
  scope: z.enum(["team", "personal"]),
  ownerId: z.string().optional(),
  targetValue: z.coerce.number().min(0),
  currentValue: z.coerce.number().min(0),
  targetDate: z.string().optional(),
});

export async function createOrganizationGoalAction(formData: FormData) {
  const parsed = createGoalSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    scope: String(formData.get("scope") ?? "personal"),
    ownerId: String(formData.get("ownerId") ?? "") || undefined,
    targetValue: String(formData.get("targetValue") ?? "0"),
    currentValue: String(formData.get("currentValue") ?? "0"),
    targetDate: String(formData.get("targetDate") ?? "") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const ownerId =
    parsed.data.scope === "personal" ? user.id : parsed.data.ownerId || user.id;

  const { data: created, error } = await supabase
    .from("organization_goals")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      scope: parsed.data.scope,
      owner_id: ownerId,
      target_value: parsed.data.targetValue,
      current_value: parsed.data.currentValue,
      target_date: parsed.data.targetDate ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "organizacion",
    action: "goal_created",
    entityType: "organization_goal",
    entityId: created.id as string,
    metadata: { title: parsed.data.title, scope: parsed.data.scope },
  });

  revalidatePath("/organizacion/objetivos");
}

const updateProgressSchema = z.object({
  goalId: z.string().uuid("Objetivo inválido."),
  currentValue: z.coerce.number().min(0, "El valor actual no puede ser negativo."),
});

/** Permite ajustar el progreso sin borrar el objetivo (RLS: owner/admin/creador). */
export async function updateOrganizationGoalProgressAction(formData: FormData) {
  const parsed = updateProgressSchema.safeParse({
    goalId: String(formData.get("goalId") ?? ""),
    currentValue: String(formData.get("currentValue") ?? ""),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase
    .from("organization_goals")
    .update({ current_value: parsed.data.currentValue })
    .eq("id", parsed.data.goalId);

  if (error) throw new Error(error.message);
  revalidatePath("/organizacion/objetivos");
}


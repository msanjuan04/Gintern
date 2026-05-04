"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const createSubscriptionSchema = z.object({
  name: z.string().min(2, "Nombre obligatorio."),
  provider: z.string().min(2, "Proveedor obligatorio."),
  amount: z.coerce.number().min(0, "Importe inválido."),
  billingPeriod: z.enum(["monthly", "quarterly", "annual"]),
  startsOn: z.string().min(1, "Fecha de inicio obligatoria."),
  nextRenewal: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export async function createSubscriptionAction(formData: FormData) {
  const parsed = createSubscriptionSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    provider: String(formData.get("provider") ?? ""),
    amount: String(formData.get("amount") ?? "0"),
    billingPeriod: String(formData.get("billingPeriod") ?? "monthly"),
    startsOn: String(formData.get("startsOn") ?? ""),
    nextRenewal: String(formData.get("nextRenewal") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
    name: parsed.data.name,
    provider: parsed.data.provider,
    amount: parsed.data.amount,
    billing_period: parsed.data.billingPeriod,
    starts_on: parsed.data.startsOn,
    next_renewal: parsed.data.nextRenewal || null,
    owner_id: user.id,
    notes: parsed.data.notes || null,
    is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await createActivityLog({
    module: "finanzas",
    action: "subscription_created",
    entityType: "subscription",
    entityId: data.id,
    metadata: { provider: parsed.data.provider, amount: parsed.data.amount },
  });
  revalidatePath("/finanzas");
  revalidatePath("/logs");
}

export async function toggleSubscriptionActiveAction(id: string, nextActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ is_active: nextActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await createActivityLog({
    module: "finanzas",
    action: "subscription_toggled",
    entityType: "subscription",
    entityId: id,
    metadata: { is_active: nextActive },
  });

  revalidatePath("/finanzas");
  revalidatePath("/logs");
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadMovementAttachmentAction(movementId: string, formData: FormData) {
  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  if (!file) throw new Error("Selecciona un archivo.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFilename(file.name || "adjunto");
  const storagePath = `finanzas/movements/${movementId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(storagePath, buffer, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("movements")
    .update({ attachment_path: storagePath })
    .eq("id", movementId);
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "finanzas",
    action: "movement_attachment_uploaded",
    entityType: "movement",
    entityId: movementId,
    metadata: { path: storagePath },
  });

  revalidatePath("/finanzas");
  revalidatePath("/logs");
}

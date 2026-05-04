"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

const credentialSchema = z.object({
  service: z.string().min(2, "Servicio obligatorio."),
  accountIdentifier: z.string().min(2, "Cuenta obligatoria."),
  scope: z.enum(["internal", "client"]),
  clientId: z.string().uuid().optional(),
  environment: z.enum(["prod", "staging", "dev", "other"]),
  secretHint: z.string().max(200).optional(),
  vaultSecretRef: z.string().max(200).optional(),
  rotationDueOn: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).refine((data) => data.scope === "internal" || Boolean(data.clientId), {
  message: "Selecciona un cliente para credenciales de cliente.",
  path: ["clientId"],
});

export async function createCredentialAction(formData: FormData) {
  const parsed = credentialSchema.safeParse({
    service: String(formData.get("service") ?? ""),
    accountIdentifier: String(formData.get("accountIdentifier") ?? ""),
    scope: String(formData.get("scope") ?? "internal"),
    clientId: String(formData.get("clientId") ?? "") || undefined,
    environment: String(formData.get("environment") ?? "prod"),
    secretHint: String(formData.get("secretHint") ?? "") || undefined,
    vaultSecretRef: String(formData.get("vaultSecretRef") ?? "") || undefined,
    rotationDueOn: String(formData.get("rotationDueOn") ?? "") || undefined,
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("credentials")
    .insert({
      service: parsed.data.service,
      account_identifier: parsed.data.accountIdentifier,
      scope: parsed.data.scope,
      client_id: parsed.data.scope === "client" ? parsed.data.clientId ?? null : null,
      environment: parsed.data.environment,
      secret_hint: parsed.data.secretHint || null,
      vault_secret_ref: parsed.data.vaultSecretRef || null,
      rotation_due_on: parsed.data.rotationDueOn || null,
      notes: parsed.data.notes || null,
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createActivityLog({
    module: "boveda",
    action: "credential_created",
    entityType: "credential",
    entityId: data.id,
    metadata: {
      service: parsed.data.service,
      environment: parsed.data.environment,
      scope: parsed.data.scope,
      clientId: parsed.data.scope === "client" ? parsed.data.clientId ?? null : null,
    },
  });

  revalidatePath("/boveda");
  revalidatePath("/logs");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createActivityLog } from "@/lib/activity-logs/server";
import { createClient } from "@/lib/supabase/server";

import { clientSchema } from "./schema";

const INTERACTION_TYPES = new Set([
  "note",
  "call",
  "meeting",
  "email",
  "whatsapp",
  "other",
]);

export type ClientFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function parseFormData(formData: FormData) {
  return clientSchema.parse({
    nombre: String(formData.get("nombre") ?? ""),
    nif: formData.get("nif") ? String(formData.get("nif")) : undefined,
    email: formData.get("email") ? String(formData.get("email")) : undefined,
    contacto: formData.get("contacto")
      ? String(formData.get("contacto"))
      : undefined,
    telefono: formData.get("telefono")
      ? String(formData.get("telefono"))
      : undefined,
    direccion: formData.get("direccion")
      ? String(formData.get("direccion"))
      : undefined,
    notas: formData.get("notas") ? String(formData.get("notas")) : undefined,
    stage: String(formData.get("stage") ?? "lead"),
    estimated_ltv: Number(formData.get("estimated_ltv") ?? 0),
    activo: formData.get("activo") === "on" || formData.get("activo") === "true",
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

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  let input;
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...input, created_by: user.id })
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  await createActivityLog({
    module: "clientes",
    action: "client_created",
    entityType: "client",
    entityId: data.id as string,
    metadata: { nombre: input.nombre },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  let input;
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

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(input).eq("id", id);

  if (error) return { status: "error", message: error.message };

  await createActivityLog({
    module: "clientes",
    action: "client_updated",
    entityType: "client",
    entityId: id,
    metadata: { nombre: input.nombre },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { status: "saved" };
}

export async function toggleClientActivoAction(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ activo })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}

export async function addClientInteractionAction(
  clientId: string,
  formData: FormData
) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) throw new Error("La nota no puede estar vacía.");
  const interactionType = String(formData.get("interactionType") ?? "note");
  const safeType = INTERACTION_TYPES.has(interactionType)
    ? interactionType
    : "note";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase.from("client_interactions").insert({
    client_id: clientId,
    author_id: user.id,
    interaction_type: safeType,
    content,
  });

  if (error) throw new Error(error.message);

  const { data: clientRow } = await supabase
    .from("clients")
    .select("nombre")
    .eq("id", clientId)
    .maybeSingle();

  await createActivityLog({
    module: "clientes",
    action: "client_interaction_added",
    entityType: "client",
    entityId: clientId,
    metadata: { nombre: clientRow?.nombre ?? null, type: safeType },
  });

  revalidatePath(`/clientes/${clientId}`);
}

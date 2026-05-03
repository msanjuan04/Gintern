"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { clientSchema } from "./schema";

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

  const supabase = createClient();
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

  const supabase = createClient();
  const { error } = await supabase.from("clients").update(input).eq("id", id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { status: "saved" };
}

export async function toggleClientActivoAction(id: string, activo: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .update({ activo })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}

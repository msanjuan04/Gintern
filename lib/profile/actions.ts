"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";

import { profileSchema, type ProfileInput } from "./schema";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type TelegramTestResult =
  | { ok: true }
  | { ok: false; message: string };

function num(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function parseFormData(formData: FormData): ProfileInput {
  return profileSchema.parse({
    nombre: formData.get("nombre") ?? "",
    apellidos: formData.get("apellidos") ?? "",
    nif: formData.get("nif") ?? "",
    direccion: formData.get("direccion") ?? "",
    cp: formData.get("cp") ?? "",
    ciudad: formData.get("ciudad") ?? "",
    iban: formData.get("iban") ?? "",
    irpf_pct: num(formData.get("irpf_pct"), 15),
    iva_pct: num(formData.get("iva_pct"), 21),
    telegram_chat_id: formData.get("telegram_chat_id") ?? "",
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

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  let input: ProfileInput;
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

  const { error } = await supabase
    .from("users")
    .update(input)
    .eq("id", user.id);

  if (error) return { status: "error", message: error.message };

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function sendTelegramTestAction(): Promise<TelegramTestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const { data: profile, error } = await supabase
    .from("users")
    .select("telegram_chat_id, nombre")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!profile?.telegram_chat_id) {
    return {
      ok: false,
      message:
        "Aún no has guardado tu chat_id. Pégalo en el campo y guarda antes de probar.",
    };
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return {
      ok: false,
      message:
        "El servidor no tiene configurado TELEGRAM_BOT_TOKEN. Avisa al admin.",
    };
  }

  const ok = await sendTelegram(
    profile.telegram_chat_id,
    [
      "🟢 *GNERAI Finance*",
      "",
      `Hola ${profile.nombre ?? "socio"}, las notificaciones funcionan correctamente.`,
    ].join("\n")
  );

  return ok
    ? { ok: true }
    : {
        ok: false,
        message:
          "El envío falló. Revisa que el chat_id sea correcto y que hayas escrito /start al bot.",
      };
}

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

export type AvatarActionState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadAvatarAction(
  _prev: AvatarActionState,
  formData: FormData
): Promise<AvatarActionState> {
  const raw = formData.get("avatar");
  if (!(raw instanceof File) || raw.size === 0) {
    return { status: "error", message: "Selecciona una imagen." };
  }
  if (raw.size > MAX_AVATAR_BYTES) {
    return { status: "error", message: "La imagen supera 2 MB." };
  }
  if (!ALLOWED_MIME.has(raw.type)) {
    return { status: "error", message: "Usa JPG, PNG, WebP o GIF." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const ext = extForMime(raw.type);
  const path = `${user.id}/avatar.${ext}`;
  const bytes = Buffer.from(await raw.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: raw.type,
      upsert: true,
    });

  if (uploadError) {
    return { status: "error", message: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatar_url = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("users")
    .update({ avatar_url })
    .eq("id", user.id);

  if (dbError) {
    return { status: "error", message: dbError.message };
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function removeAvatarAction(_formData?: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: list } = await supabase.storage.from("avatars").list(user.id);
  if (list?.length) {
    const paths = list.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("avatars").remove(paths);
  }

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    console.error("[removeAvatar]", error.message);
    return;
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
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
      "*GNERAI OS*",
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

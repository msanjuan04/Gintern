"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getEmailRole,
  isAllowedEmail,
  landingPathForRole,
} from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Introduce un email válido." };
  }
  if (!password) {
    return { status: "error", message: "Introduce tu contraseña." };
  }

  if (!isAllowedEmail(email)) {
    return {
      status: "error",
      message: "Este email no está autorizado para acceder a GNERAI OS.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message:
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message,
    };
  }

  const role = getEmailRole(email);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    if (role) {
      await supabase.from("users").update({ role }).eq("id", user.id);
    }

    // Asegura que el usuario está en team_members (lo usan las RLS de
    // finanzas, bóveda, wiki, ficheros, logs, calendar y organización).
    // Si no existe, lo creamos como admin activo; si ya existe, no tocamos
    // su rol/estado para no pisar configuración manual.
    const profileFromUsers = await supabase
      .from("users")
      .select("nombre, apellidos")
      .eq("id", user.id)
      .maybeSingle();
    const fullName = [
      profileFromUsers.data?.nombre,
      profileFromUsers.data?.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    await supabase.from("team_members").upsert(
      {
        id: user.id,
        email,
        full_name: fullName || email,
        role: "admin",
        is_active: true,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  revalidatePath("/", "layout");
  redirect(landingPathForRole(role));
}

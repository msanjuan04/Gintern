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
      message: "Este email no está autorizado para acceder a GNERAI Finance.",
    };
  }

  const supabase = createClient();
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

  // Sincroniza el rol desde el env var hacia public.users.
  const role = getEmailRole(email);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && role) {
    await supabase.from("users").update({ role }).eq("id", user.id);
  }

  revalidatePath("/", "layout");
  redirect(landingPathForRole(role));
}

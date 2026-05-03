import { NextResponse, type NextRequest } from "next/server";

import {
  getEmailRole,
  isAllowedEmail,
  landingPathForRole,
} from "@/lib/auth/allowlist";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedRedirect = searchParams.get("redirect");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/no-autorizado`);
  }

  // Sincroniza el rol desde el env var hacia public.users.
  const role = getEmailRole(user.email);
  if (role) {
    await supabase.from("users").update({ role }).eq("id", user.id);
  }

  const redirectTo = requestedRedirect ?? landingPathForRole(role);
  return NextResponse.redirect(`${origin}${redirectTo}`);
}

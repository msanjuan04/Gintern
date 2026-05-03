import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getEmailRole,
  isAllowedEmail,
  isPathBlockedForRole,
  landingPathForRole,
} from "@/lib/auth/allowlist";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/no-autorizado"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Si el usuario está autenticado pero su email no está en la allowlist,
  // forzamos el cierre de sesión y le mandamos a la pantalla de no-autorizado.
  if (user && !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    if (pathname !== "/auth/no-autorizado") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/no-autorizado";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = getEmailRole(user.email);

    // Bloqueo de rutas según rol (colaborador no entra a dashboard,
    // movimientos ni balance).
    if (isPathBlockedForRole(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = landingPathForRole(role);
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = landingPathForRole(role);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

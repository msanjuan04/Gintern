import "server-only";

import type { NextRequest } from "next/server";

/**
 * Verifica que la petición venga del scheduler de Vercel (o de una llamada
 * manual con el secret). Vercel añade `Authorization: Bearer <CRON_SECRET>`
 * automáticamente cuando la env var está definida.
 *
 * Si no hay CRON_SECRET configurado, devolvemos true en desarrollo para
 * facilitar pruebas locales con curl.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

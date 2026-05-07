// Allowlist de emails autorizados a entrar en GNERAI OS.
// Formato del env var ALLOWED_EMAILS:
//   email[:role],email[:role],...
// donde role ∈ {socio, colaborador}. Si se omite, se asume socio.
//
// Ejemplo:
//   ALLOWED_EMAILS=msanjuan@gnerai.com,mcortada@gnerai.com,ayudante@gnerai.com:colaborador

export type Role = "socio" | "colaborador";

function parseEntry(raw: string): [string, Role] | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const [emailPart, rolePart] = trimmed.split(":");
  const email = emailPart.trim();
  if (!email) return null;
  const role: Role = rolePart?.trim() === "colaborador" ? "colaborador" : "socio";
  return [email, role];
}

const ALLOWED: Map<string, Role> = new Map(
  (process.env.ALLOWED_EMAILS ?? "msanjuan@gnerai.com,mcortada@gnerai.com")
    .split(",")
    .map(parseEntry)
    .filter((e): e is [string, Role] => e !== null)
);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED.has(email.trim().toLowerCase());
}

export function getEmailRole(email: string | null | undefined): Role | null {
  if (!email) return null;
  return ALLOWED.get(email.trim().toLowerCase()) ?? null;
}

export function getAllowedEmails(): string[] {
  return Array.from(ALLOWED.keys());
}

// Ruta de aterrizaje según rol: ambos al panel de estado.
export function landingPathForRole(role: Role | null): string {
  return "/dashboard";
}

// Rutas que un colaborador NO puede ver.
const COLABORADOR_BLOCKED_PREFIXES = [
  "/propuestas",
  "/finanzas",
  "/boveda",
  "/wiki",
  "/logs",
];

export function isPathBlockedForRole(
  pathname: string,
  role: Role | null
): boolean {
  if (role !== "colaborador") return false;
  return COLABORADOR_BLOCKED_PREFIXES.some((p) => pathname.startsWith(p));
}

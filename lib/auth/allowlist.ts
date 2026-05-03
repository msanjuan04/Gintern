// Allowlist de emails autorizados a entrar en GNERAI Finance.
// Solo los dos socios pueden iniciar sesión.
const ALLOWED_EMAILS = new Set(
  (process.env.ALLOWED_EMAILS ?? "msanjuan@gnerai.com,mcortada@gnerai.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.has(email.trim().toLowerCase());
}

export function getAllowedEmails(): string[] {
  return Array.from(ALLOWED_EMAILS);
}

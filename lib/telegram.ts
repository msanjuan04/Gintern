import "server-only";

/**
 * Envía un mensaje a Telegram. Falla silenciosamente si:
 * - no hay TELEGRAM_BOT_TOKEN configurado
 * - el usuario no tiene chat_id asociado
 * - hay error de red (lo logueamos pero no rompemos el flujo)
 *
 * Devuelve true si el mensaje se envió, false en cualquier otro caso.
 */
export async function sendTelegram(
  chatId: string | null | undefined,
  text: string,
  opts: { parseMode?: "Markdown" | "MarkdownV2" | "HTML" } = {}
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  if (!chatId) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: opts.parseMode ?? "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[telegram] sendMessage failed (${res.status}):`,
        body.slice(0, 500)
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram] fetch error:", err);
    return false;
  }
}


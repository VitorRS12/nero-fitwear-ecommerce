import type { EmailContent } from "./templates";

const RESEND_API_URL = "https://api.resend.com/emails";
export const EMAIL_SENDERS = {
  pedidos: "NERO Fitwear · Pedidos <pedidos@nerofitwear.com.br>",
  suporte: "NERO Fitwear · Suporte <suporte@nerofitwear.com.br>",
  contato: "NERO Fitwear <contato@nerofitwear.com.br>",
} as const;

export type EmailSender = keyof typeof EMAIL_SENDERS;

export async function sendEmail(to: string, content: EmailContent, idempotencyKey: string, sender: EmailSender = "contato"): Promise<boolean> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.error("[email] RESEND_API_KEY ausente");
    return false;
  }
  if (!to || to.endsWith(".invalid")) return false;
  try {
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
        "X-Connection-Api-Key": resendKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from: EMAIL_SENDERS[sender], reply_to: EMAIL_SENDERS[sender], to: [to], subject: content.subject, html: content.html, text: content.text }),
    });
    if (!res.ok) {
      console.error(`[email] envio falhou [${res.status}]: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] envio falhou", error instanceof Error ? error.message : "unknown");
    return false;
  }
}

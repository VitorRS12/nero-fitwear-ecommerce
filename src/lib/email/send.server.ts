import type { EmailContent } from "./templates";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
export const EMAIL_SENDERS = {
  pedidos: "NERO Fitwear · Pedidos <pedidos@nerofitwear.com.br>",
  suporte: "NERO Fitwear · Suporte <suporte@nerofitwear.com.br>",
  contato: "NERO Fitwear <contato@nerofitwear.com.br>",
} as const;

export type EmailSender = keyof typeof EMAIL_SENDERS;

/**
 * Envia um e-mail pela Resend. Nunca lança: falha de e-mail não pode quebrar pagamento ou pedido.
 * `idempotencyKey` impede envio duplicado do mesmo aviso (webhook + consulta, por exemplo).
 */
export async function sendEmail(to: string, content: EmailContent, idempotencyKey: string, sender: EmailSender = "contato"): Promise<boolean> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    console.error("[email] LOVABLE_API_KEY ou RESEND_API_KEY ausente");
    return false;
  }
  if (!to || to.endsWith(".invalid")) return false;
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
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

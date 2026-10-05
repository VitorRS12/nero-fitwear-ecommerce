const MERCADO_PAGO_API = "https://api.mercadopago.com";

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount: number;
  date_created?: string;
  date_approved?: string;
  date_of_expiration?: string;
  payment_method_id?: string;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
}

interface CreatePixInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  expiresAt: string;
  idempotencyKey: string;
}

function accessToken(): string {
  const token = process.env['MERCADO_PAGO_ACCESS_TOKEN'];
  if (!token) throw new Error("Mercado Pago ainda não foi configurado.");
  return token;
}

async function mercadoPagoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`[mercado-pago] request failed [${response.status}]: ${text}`);
    throw new Error("O Mercado Pago não conseguiu processar o PIX.");
  }
  return JSON.parse(text) as T;
}

export function createPixPayment(input: CreatePixInput): Promise<MercadoPagoPayment> {
  return mercadoPagoRequest<MercadoPagoPayment>("/v1/payments", {
    method: "POST",
    headers: { "X-Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      transaction_amount: Number(input.amount.toFixed(2)),
      description: `Pedido ${input.orderNumber}`,
      payment_method_id: "pix",
      external_reference: input.orderId,
      date_of_expiration: input.expiresAt,
      payer: {
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        identification: { type: "CPF", number: input.cpf },
      },
      metadata: { order_id: input.orderId, order_number: input.orderNumber },
    }),
  });
}

export function getMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^\d{1,30}$/.test(paymentId)) throw new Error("Pagamento inválido.");
  return mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
}

export function cancelMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^\d{1,30}$/.test(paymentId)) throw new Error("Pagamento inválido.");
  return mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${paymentId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export function paymentSnapshot(payment: MercadoPagoPayment) {
  return {
    id: String(payment.id),
    status: payment.status,
    status_detail: payment.status_detail ?? null,
    external_reference: payment.external_reference ?? null,
    transaction_amount: payment.transaction_amount,
    payment_method_id: payment.payment_method_id ?? null,
    date_created: payment.date_created ?? null,
    date_approved: payment.date_approved ?? null,
    date_of_expiration: payment.date_of_expiration ?? null,
  };
}

export function pixInstructions(payment: MercadoPagoPayment) {
  const data = payment.point_of_interaction?.transaction_data;
  return { copyPaste: data?.qr_code ?? "", qrCodeBase64: data?.qr_code_base64 ?? "", ticketUrl: data?.ticket_url ?? "" };
}

function parseSignature(signature: string): { ts: string; hash: string } | null {
  const fields = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  return fields.ts && fields.v1 ? { ts: fields.ts, hash: fields.v1 } : null;
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function verifyMercadoPagoSignature(input: { signature: string; requestId: string; dataId: string }): Promise<boolean> {
  const secret = process.env['MERCADO_PAGO_WEBHOOK_SECRET'];
  if (!secret) throw new Error("Webhook do Mercado Pago ainda não foi configurado.");
  const parsed = parseSignature(input.signature);
  if (!parsed) return false;
  const timestamp = Number(parsed.ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestId};ts:${parsed.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return constantTimeEqual(expected, parsed.hash);
}
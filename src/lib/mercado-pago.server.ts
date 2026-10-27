/** Integração server-only com a API de pagamentos do Mercado Pago. */

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail?: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_type_id?: string | null;
  payment_method_id?: string | null;
  external_reference?: string | null;
  metadata?: Record<string, unknown> | null;
  date_created?: string | null;
  date_approved?: string | null;
  transaction_amount_refunded?: number | null;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } | null;
  } | null;
}

const API = "https://api.mercadopago.com";

function token(): string {
  const t = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!t) throw new Error("Mercado Pago não configurado.");
  return t;
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^\d{1,20}$/.test(paymentId)) throw new Error("ID de pagamento inválido.");
  const res = await fetch(`${API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`Mercado Pago respondeu ${res.status} ao consultar pagamento.`);
  return (await res.json()) as MercadoPagoPayment;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  notificationUrl?: string | undefined;
  form: {
    token?: string;
    payment_method_id: string;
    issuer_id?: string | number;
    installments?: number;
    payer: { email: string; identification?: { type: string; number: string } };
  };
}

/** Monta o corpo do pagamento. O valor sempre vem do pedido no banco, nunca do navegador. */
export function buildPaymentBody(input: CreatePaymentInput) {
  const { form } = input;
  const isPix = form.payment_method_id === "pix";
  const body: Record<string, unknown> = {
    transaction_amount: Math.round(input.amount * 100) / 100,
    description: `Pedido ${input.orderNumber} — NERO Fitwear`,
    payment_method_id: form.payment_method_id,
    external_reference: input.orderId,
    metadata: { order_id: input.orderId },
    statement_descriptor: "NERO FITWEAR",
    payer: { email: form.payer.email, ...(form.payer.identification ? { identification: form.payer.identification } : {}) },
  };
  if (input.notificationUrl) body["notification_url"] = input.notificationUrl;
  if (isPix) {
    body["date_of_expiration"] = new Date(Date.now() + 30 * 60_000).toISOString().replace("Z", "+00:00");
  } else {
    body["token"] = form.token;
    body["installments"] = form.installments ?? 1;
    if (form.issuer_id !== undefined && form.issuer_id !== "") body["issuer_id"] = Number(form.issuer_id);
  }
  return body;
}

export async function createMercadoPagoPayment(input: CreatePaymentInput): Promise<MercadoPagoPayment> {
  if (!(input.amount > 0)) throw new Error("Valor do pedido inválido.");
  const body = buildPaymentBody(input);
  const idem = `nero-${input.orderId}-${input.form.token ?? "pix"}`.slice(0, 120);
  const res = await fetch(`${API}/v1/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": idem },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as (MercadoPagoPayment & { message?: string }) | null;
  if (!res.ok || !json?.id) {
    const cause = (json as { cause?: Array<{ code?: unknown; description?: unknown }> } | null)?.cause ?? [];
    console.error(
      "[mercado-pago] create payment failed",
      res.status,
      json?.message ?? "",
      JSON.stringify(cause.map((c) => ({ code: c.code, description: c.description }))),
    );
    throw new Error("O Mercado Pago não aceitou o pagamento. Confira os dados ou tente outro meio.");
  }
  return json;
}

/** Snapshot sem dados pessoais para gravar no banco. */
export function paymentSnapshot(p: MercadoPagoPayment) {
  return {
    id: p.id,
    status: p.status,
    status_detail: p.status_detail ?? null,
    amount: p.transaction_amount,
    refunded: p.transaction_amount_refunded ?? null,
    currency: p.currency_id,
    payment_type_id: p.payment_type_id ?? null,
    payment_method_id: p.payment_method_id ?? null,
    external_reference: p.external_reference ?? null,
    date_created: p.date_created ?? null,
    date_approved: p.date_approved ?? null,
  };
}

export function resolveOrderId(p: MercadoPagoPayment): string | null {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ref = p.external_reference?.trim();
  if (ref && uuid.test(ref)) return ref;
  const meta = p.metadata?.["order_id"];
  return typeof meta === "string" && uuid.test(meta) ? meta : null;
}

/** Reaplica o estado oficial do pagamento ao pedido via RPC atômica (idempotente). */
export async function applyMercadoPagoPayment(p: MercadoPagoPayment) {
  const orderId = resolveOrderId(p);
  if (!orderId) return { ok: false, reason: "missing_order" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("apply_mercado_pago_payment", {
    _order_id: orderId,
    _external_reference: p.external_reference ?? "",
    _provider_payment_id: String(p.id),
    _provider_status: p.status,
    _status_detail: p.status_detail ?? "",
    _amount: p.status === "refunded" && p.transaction_amount_refunded ? p.transaction_amount_refunded : p.transaction_amount,
    _currency: p.currency_id,
    _method: p.payment_type_id ?? p.payment_method_id ?? "",
    _raw_payload: paymentSnapshot(p),
  } as never);
  if (error) {
    console.error("[mercado-pago] reconciliation database error");
    throw new Error("Falha ao registrar pagamento.");
  }
  // A RPC pode recusar a conciliação sem devolver um erro de transporte.
  // Nunca confirmar o processamento apenas porque a chamada ao banco respondeu.
  if (!data || typeof data !== "object" || Array.isArray(data) || data["ok"] !== true) {
    console.error("[mercado-pago] reconciliation rejected");
    throw new Error("Falha ao conciliar pagamento.");
  }
  return { ok: true, result: data };
}

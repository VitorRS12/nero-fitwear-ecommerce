import type { CardFormData, CardOrder } from "@/types/card-payment";
import { mercadoPagoRequest, type MercadoPagoPayment } from "@/lib/mercado-pago.server";

export interface CreateCardInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  attemptKey: string;
  card: CardFormData;
}

export function buildCardPayload(input: CreateCardInput) {
  return {
    transaction_amount: Number(input.amount.toFixed(2)),
    description: `Pedido ${input.orderNumber}`,
    external_reference: input.orderId,
    token: input.card.token,
    payment_method_id: input.card.payment_method_id,
    issuer_id: input.card.issuer_id === undefined ? undefined : String(input.card.issuer_id),
    installments: input.card.installments,
    payer: input.card.payer,
    three_d_secure_mode: "optional",
    metadata: { order_id: input.orderId, order_number: input.orderNumber, attempt_key: input.attemptKey },
  };
}

export async function createCardPayment(input: CreateCardInput): Promise<MercadoPagoPayment> {
  const methods = await mercadoPagoRequest<Array<{ id: string; payment_type_id: string }>>("/v1/payment_methods");
  const method = methods.find((entry) => entry.id === input.card.payment_method_id);
  if (!method || !["credit_card", "debit_card"].includes(method.payment_type_id))
    throw new Error("Este meio de pagamento não está disponível para cartão.");
  if (method.payment_type_id === "debit_card" && input.card.installments !== 1)
    throw new Error("Cartão de débito deve ser pago à vista.");
  return mercadoPagoRequest<MercadoPagoPayment>("/v1/payments", {
    method: "POST",
    headers: { "X-Idempotency-Key": input.attemptKey },
    body: JSON.stringify(buildCardPayload(input)),
  });
}

export function cardResult(order: { id: string; order_number: string; total: number; payment_status: CardOrder["paymentStatus"] }, payment?: MercadoPagoPayment): CardOrder {
  const info = payment?.three_ds_info;
  const challenge = payment?.status_detail === "pending_challenge" && info?.external_resource_url?.startsWith("https://") && info.creq
    ? { externalResourceURL: info.external_resource_url, creq: info.creq } : null;
  return { id: order.id, orderNumber: order.order_number, total: order.total,
    paymentStatus: order.payment_status, paymentId: payment ? String(payment.id) : null,
    statusDetail: payment?.status_detail ?? null, challenge };
}
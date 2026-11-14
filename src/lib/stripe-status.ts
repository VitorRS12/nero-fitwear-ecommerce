// Regras puras do pagamento Stripe (sem dependências de servidor) para facilitar testes.
export type OrderPaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "refunded";

export function toCents(amount: number): number {
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function mapStripeStatus(status: string): OrderPaymentStatus {
  if (status === "succeeded") return "approved";
  if (status === "canceled") return "cancelled";
  if (status === "requires_payment_method") return "rejected";
  return "pending";
}

/** Método salvo no pedido: "pix" ou "card" (crédito e débito). */
export function paymentMethodFromTypes(type: string | null | undefined): "pix" | "card" | null {
  if (type === "pix") return "pix";
  if (type === "card") return "card";
  return null;
}

export function amountMatches(orderTotal: number, intentAmountCents: number): boolean {
  return toCents(orderTotal) === Math.round(intentAmountCents);
}

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { paymentSnapshot, type MercadoPagoPayment } from "@/lib/mercado-pago.server";

export async function reconcileCardPayment(orderId: string, payment: MercadoPagoPayment) {
  if (payment.external_reference !== orderId || !["credit_card", "debit_card"].includes(payment.payment_type_id ?? ""))
    throw new Error("Cobrança não corresponde ao pedido.");
  const { data: local, error } = await supabaseAdmin.from("payments")
    .select("idempotency_key, provider_payment_id").eq("order_id", orderId).eq("provider", "mercadopago").single();
  if (error || !local) throw new Error("Cobrança não registrada.");
  // A delayed notification from a rejected attempt must never affect the next attempt.
  if (payment.metadata?.attempt_key !== local.idempotency_key) return false;
  const { error: saveError } = await supabaseAdmin.rpc("record_card_payment", {
    _order_id: orderId, _attempt_key: local.idempotency_key ?? "",
    _payment_id: String(payment.id), _amount: payment.transaction_amount,
    _payload: paymentSnapshot(payment),
  });
  if (saveError) throw new Error("Não foi possível registrar a cobrança.");
  // record_card_payment applies the status while holding the same order lock.
  // Never split recording and applying across two transactions.
  return true;
}
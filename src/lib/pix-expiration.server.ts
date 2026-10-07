import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  cancelMercadoPagoPayment,
  findMercadoPagoPaymentsByReference,
  getMercadoPagoPayment,
  paymentSnapshot,
} from "@/lib/mercado-pago.server";

/**
 * Libera reservas de pedidos PIX vencidos. Só libera estoque quando o Mercado Pago
 * confirma que não há cobrança ativa para o pedido.
 */
export async function releaseExpiredPixOrders(limit = 100) {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, payments(provider_payment_id)")
    .eq("status", "awaiting_payment")
    .eq("payment_status", "pending")
    .is("inventory_released_at", null)
    .lt("payment_expires_at", new Date().toISOString())
    .limit(limit);
  if (error) throw new Error("Unable to read expired orders");
  let processed = 0;
  let failed = 0;
  for (const order of orders ?? []) {
    const paymentId = order.payments?.[0]?.provider_payment_id;
    try {
      if (paymentId) {
        let payment = await getMercadoPagoPayment(paymentId);
        if (payment.external_reference !== order.id || payment.payment_method_id !== "pix")
          throw new Error("Payment reference mismatch");
        if (payment.status === "pending" || payment.status === "in_process") {
          payment = await cancelMercadoPagoPayment(paymentId);
          if (payment.external_reference !== order.id) throw new Error("Cancelled payment reference mismatch");
        }
        const { error: updateError } = await supabaseAdmin.rpc("apply_mercado_pago_payment", {
          _order_id: order.id,
          _provider_payment_id: String(payment.id),
          _provider_status: payment.status,
          _amount: payment.transaction_amount,
          _raw_payload: paymentSnapshot(payment),
        });
        if (updateError) throw updateError;
        if (!["approved", "cancelled", "rejected"].includes(payment.status)) continue;
      } else {
        // Cobrança nunca salva (ex.: Mercado Pago recusou a criação). Confirma no provedor.
        const remote = await findMercadoPagoPaymentsByReference(order.id);
        if (remote.length > 0) {
          failed += 1;
          console.error("[pix-expire] remote payment without local record; manual reconciliation", order.id);
          continue;
        }
        const { error: releaseError } = await supabaseAdmin.rpc("release_order_reservation", { _order_id: order.id });
        if (releaseError) throw releaseError;
      }
      processed += 1;
    } catch (err) {
      failed += 1;
      console.error("[pix-expire] order reconciliation failed", order.id, err);
    }
  }
  return { processed, failed };
}

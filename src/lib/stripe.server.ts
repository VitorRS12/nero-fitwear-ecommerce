import Stripe from "stripe";
import { amountMatches, fromCents, mapStripeStatus, paymentMethodFromTypes } from "@/lib/stripe-status";

export function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("O pagamento ainda não foi configurado na loja.");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

/** Snapshot sem dados sensíveis para guardar no banco. */
export function intentSnapshot(pi: Stripe.PaymentIntent) {
  return {
    id: pi.id,
    status: pi.status,
    amount: pi.amount,
    currency: pi.currency,
    payment_method_type: typeof pi.payment_method === "object" && pi.payment_method ? pi.payment_method.type : null,
    last_error: pi.last_payment_error?.code ?? null,
    created: pi.created,
  };
}

function intentMethod(pi: Stripe.PaymentIntent): "pix" | "card" | null {
  if (typeof pi.payment_method === "object" && pi.payment_method) return paymentMethodFromTypes(pi.payment_method.type);
  const types = pi.payment_method_types ?? [];
  return types.length === 1 ? paymentMethodFromTypes(types[0]) : null;
}

/** Aplica o estado do PaymentIntent ao pedido (idempotente). */
export async function applyPaymentIntent(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.["order_id"];
  if (!orderId) return { ok: false, reason: "missing_order" };
  if (pi.currency !== "brl") return { ok: false, reason: "currency" };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin.from("orders").select("total").eq("id", orderId).maybeSingle();
  if (!order || !amountMatches(Number(order.total), pi.amount)) {
    console.error("[stripe] amount mismatch or order missing", { orderId, intent: pi.id });
    return { ok: false, reason: "amount_mismatch" };
  }
  const { data, error } = await supabaseAdmin.rpc("apply_stripe_payment", {
    _order_id: orderId,
    _payment_intent_id: pi.id,
    _stripe_status: pi.status,
    _amount: fromCents(pi.amount),
    _method: intentMethod(pi) ?? undefined,
    _raw_payload: intentSnapshot(pi),
  } as never);
  if (error) {
    console.error("[stripe] apply_stripe_payment failed", error.message);
    throw new Error("Falha ao registrar pagamento.");
  }
  return { ok: true, status: mapStripeStatus(pi.status), result: data };
}

/**
 * Libera reservas de pedidos Stripe vencidos. Antes de liberar, cancela o PaymentIntent;
 * se o Stripe disser que já foi pago, o pedido é confirmado em vez de liberado.
 */
export async function releaseExpiredStripeOrders(limit = 20) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const graceMs = 15 * 60 * 1000; // margem para 3DS/PIX em andamento
  const cutoff = new Date(Date.now() - graceMs).toISOString();
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("status", "awaiting_payment")
    .eq("payment_status", "pending")
    .is("inventory_released_at", null)
    .lt("payment_expires_at", cutoff)
    .limit(limit);
  if (!orders?.length) return 0;
  const stripe = getStripe();
  let released = 0;
  for (const order of orders) {
    try {
      const { data: payments } = await supabaseAdmin
        .from("payments").select("provider_payment_id")
        .eq("order_id", order.id).eq("provider", "stripe");
      const intentIds = (payments ?? []).map((p) => p.provider_payment_id).filter((id): id is string => !!id);
      let paid = false;
      for (const id of intentIds) {
        let pi = await stripe.paymentIntents.retrieve(id);
        if (pi.status === "succeeded" || pi.status === "processing") {
          await applyPaymentIntent(pi);
          paid = true;
          continue;
        }
        if (pi.status !== "canceled") pi = await stripe.paymentIntents.cancel(id);
        await applyPaymentIntent(pi);
      }
      if (!paid && intentIds.length === 0) {
        const { data } = await supabaseAdmin.rpc("release_order_reservation", { _order_id: order.id });
        if (data) released += 1;
      } else if (!paid) released += 1;
    } catch (error) {
      console.error("[stripe] expiration failed", { orderId: order.id, error: error instanceof Error ? error.message : "unknown" });
    }
  }
  return released;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OrderPaymentStatus } from "@/lib/stripe-status";

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(8).max(30),
  }),
  address: z.object({
    zipCode: z.string().trim().min(8).max(10),
    state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
    city: z.string().trim().min(2).max(120),
    neighborhood: z.string().trim().min(2).max(120),
    street: z.string().trim().min(2).max(160),
    number: z.string().trim().min(1).max(30),
    complement: z.string().trim().max(120).optional().default(""),
  }),
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  checkoutKey: z.string().uuid(),
  couponCode: z.string().trim().max(40).optional().default(""),
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50),
});

export interface StripeOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: OrderPaymentStatus;
  clientSecret: string | null;
  publishableKey: string;
}

interface PendingOrderRow {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: OrderPaymentStatus;
  paymentExpiresAt: string;
}

function publishableKey() {
  const key = process.env["STRIPE_PUBLISHABLE_KEY"];
  if (!key || !/^pk_(test|live)_/.test(key)) throw new Error("O pagamento ainda não foi configurado na loja.");
  return key;
}

/** Cria (ou reaproveita) o pedido e o PaymentIntent do Stripe. O valor vem sempre do banco. */
export const startStripeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }): Promise<StripeOrder> => {
    const pk = publishableKey();
    const { getStripe, releaseExpiredStripeOrders } = await import("@/lib/stripe.server");
    const { toCents } = await import("@/lib/stripe-status");
    const stripe = getStripe();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try { await releaseExpiredStripeOrders(10); } catch (e) { console.error("[checkout] cleanup failed", e instanceof Error ? e.message : e); }

    const { data: created, error } = await supabaseAdmin.rpc("create_pending_order", {
      _user_id: context.userId,
      _customer_name: data.customer.name,
      _customer_email: data.customer.email,
      _customer_phone: data.customer.phone,
      _shipping_address: data.address,
      _shipping_method: data.shippingMethod,
      _payment_method: "card",
      _coupon_code: data.couponCode,
      _items: data.items,
      _checkout_key: data.checkoutKey,
    });
    if (error) {
      console.error("[checkout] create_pending_order failed", error.message);
      if (error.message.startsWith("Estoque insuficiente"))
        throw new Error(`${error.message} Ajuste a quantidade na sacola ou escolha outro tamanho.`);
      if (error.message.includes("não está mais disponível")) throw new Error(error.message);
      throw new Error("Não foi possível criar o pedido. Confira os dados e tente novamente.");
    }
    const order = created as unknown as PendingOrderRow;
    if (order.paymentStatus !== "pending")
      throw new Error("Este pedido já foi encerrado. Volte à sacola e inicie uma nova compra.");

    const { data: existing } = await supabaseAdmin
      .from("payments").select("provider_payment_id")
      .eq("order_id", order.id).eq("provider", "stripe")
      .order("created_at", { ascending: false }).limit(1);
    const existingId = existing?.[0]?.provider_payment_id;
    if (existingId) {
      const pi = await stripe.paymentIntents.retrieve(existingId);
      if (pi.status !== "canceled" && pi.status !== "succeeded")
        return { id: order.id, orderNumber: order.orderNumber, total: order.total, paymentStatus: "pending", clientSecret: pi.client_secret, publishableKey: pk };
    }

    const base = {
      amount: toCents(order.total),
      currency: "brl",
      automatic_payment_methods: { enabled: true },
      receipt_email: data.customer.email,
      description: `Pedido ${order.orderNumber} — NERO Fitwear`,
      metadata: { order_id: order.id, order_number: order.orderNumber },
    };
    let pi;
    try {
      pi = await stripe.paymentIntents.create(
        { ...base, payment_method_options: { pix: { expires_after_seconds: 1800 } } },
        { idempotencyKey: `nero-order-${order.id}` },
      );
    } catch (err) {
      // Conta sem PIX liberado: segue só com cartão.
      console.error("[stripe] create with pix options failed", err instanceof Error ? err.message : err);
      pi = await stripe.paymentIntents.create(base, { idempotencyKey: `nero-order-${order.id}-card` });
    }
    const { error: saveError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id, provider: "stripe", provider_payment_id: pi.id,
      status: "pending", amount: order.total, expires_at: order.paymentExpiresAt,
    });
    if (saveError && !saveError.message.includes("duplicate")) console.error("[stripe] payment save failed", saveError.message);
    return { id: order.id, orderNumber: order.orderNumber, total: order.total, paymentStatus: "pending", clientSecret: pi.client_secret, publishableKey: pk };
  });

/** Consulta o pedido e sincroniza com o Stripe (caso o webhook ainda não tenha chegado). */
export const getStripeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<StripeOrder> => {
    const pk = publishableKey();
    const { data: order, error } = await context.supabase
      .from("orders").select("id, order_number, total, payment_status")
      .eq("id", data.orderId).eq("user_id", context.userId).single();
    if (error || !order) throw new Error("Pedido não encontrado.");
    let status = order.payment_status as OrderPaymentStatus;
    let clientSecret: string | null = null;
    const { data: payments } = await context.supabase
      .from("payments").select("provider_payment_id")
      .eq("order_id", order.id).eq("provider", "stripe")
      .order("created_at", { ascending: false }).limit(1);
    const piId = payments?.[0]?.provider_payment_id;
    if (piId && status === "pending") {
      try {
        const { getStripe, applyPaymentIntent } = await import("@/lib/stripe.server");
        const pi = await getStripe().paymentIntents.retrieve(piId, { expand: ["payment_method"] });
        if (pi.metadata?.["order_id"] === order.id) {
          await applyPaymentIntent(pi);
          clientSecret = pi.status === "succeeded" || pi.status === "canceled" ? null : pi.client_secret;
          const { data: updated } = await context.supabase.from("orders").select("payment_status").eq("id", order.id).single();
          status = (updated?.payment_status as OrderPaymentStatus) ?? status;
        }
      } catch (e) {
        console.error("[stripe] status lookup failed", e instanceof Error ? e.message : e);
      }
    }
    return { id: order.id, orderNumber: order.order_number, total: Number(order.total), paymentStatus: status, clientSecret, publishableKey: pk };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutSchema } from "@/lib/checkout.functions";
import { cardSubmissionSchema } from "@/lib/card-payment.schema";

export const getCardConfiguration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const publicKey = process.env["MERCADO_PAGO_PUBLIC_KEY"];
    if (!publicKey) throw new Error("Pagamento com cartão ainda não foi configurado.");
    // This is the provider's public SDK credential, never the private access token.
    return { publicKey };
  });

export const prepareCardOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.omit({ cpf: true, paymentMethod: true }).parse(input))
  .handler(async ({ data, context }) => {
    if (!process.env["MERCADO_PAGO_PUBLIC_KEY"] || !process.env["MERCADO_PAGO_ACCESS_TOKEN"])
      throw new Error("Pagamento com cartão ainda não foi configurado.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pending, error } = await supabaseAdmin.rpc("create_pending_order", {
      _user_id: context.userId, _customer_name: data.customer.name, _customer_email: data.customer.email,
      _customer_phone: data.customer.phone, _shipping_address: data.address, _shipping_method: data.shippingMethod,
      _payment_method: "card", _coupon_code: data.couponCode, _items: data.items, _checkout_key: data.checkoutKey,
    });
    if (error) throw new Error(error.message.startsWith("Estoque insuficiente") ? error.message : "Não foi possível preparar o pedido.");
    const parsed = z.object({ id: z.string().uuid() }).parse(pending);
    const { data: order } = await context.supabase.from("orders")
      .select("id, order_number, total, payment_status, payment_method, payment_expires_at")
      .eq("id", parsed.id).eq("user_id", context.userId).single();
    if (!order || order.payment_method !== "card") throw new Error("Inicie uma nova compra para mudar o pagamento.");
    const { cardResult } = await import("@/lib/card-payment.server");
    return cardResult(order);
  });

export const getCardOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders")
      .select("id, order_number, total, payment_status, payment_method")
      .eq("id", data.orderId).eq("user_id", context.userId).single();
    if (!order || order.payment_method !== "card") throw new Error("Pedido não encontrado.");
    const { data: local } = await context.supabase.from("payments")
      .select("provider_payment_id, idempotency_key").eq("order_id", order.id).eq("provider", "mercadopago").maybeSingle();
    const provider = await import("@/lib/mercado-pago.server");
    const { cardResult } = await import("@/lib/card-payment.server");
    if (!local) return cardResult(order);
    const payment = local.provider_payment_id ? await provider.getMercadoPagoPayment(local.provider_payment_id)
      : (await provider.findMercadoPagoPaymentsByReference(order.id)).find((entry) => entry.metadata?.attempt_key === local.idempotency_key);
    if (!payment) return { ...cardResult(order), statusDetail: "processing" };
    const { reconcileCardPayment } = await import("@/lib/card-payment-reconcile.server");
    await reconcileCardPayment(order.id, payment);
    const { data: updated } = await context.supabase.from("orders").select("payment_status").eq("id", order.id).eq("user_id", context.userId).single();
    return cardResult({ ...order, payment_status: updated?.payment_status ?? order.payment_status }, payment);
  });

export const submitCardOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cardSubmissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders")
      .select("id, order_number, total, payment_status, payment_method")
      .eq("id", data.orderId).eq("user_id", context.userId).single();
    if (!order || order.payment_method !== "card") throw new Error("Pedido não encontrado.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt, error } = await supabaseAdmin.rpc("begin_card_payment", {
      _order_id: order.id, _user_id: context.userId, _attempt_key: data.attemptKey,
    });
    if (error) throw new Error("Não foi possível iniciar o pagamento. Consulte o pedido ou inicie uma nova compra.");
    const locked = z.object({ attemptKey: z.string().uuid(), paymentId: z.string().nullable(), status: z.string() }).parse(attempt);
    const provider = await import("@/lib/mercado-pago.server");
    const { createCardPayment, cardResult } = await import("@/lib/card-payment.server");
    const found = locked.paymentId ? await provider.getMercadoPagoPayment(locked.paymentId)
      : (await provider.findMercadoPagoPaymentsByReference(order.id)).find((entry) => entry.metadata?.attempt_key === locked.attemptKey);
    if (!found && locked.attemptKey !== data.attemptKey)
      throw new Error("Há uma tentativa em processamento. Aguarde a confirmação antes de pagar novamente.");
    const payment = found ?? await createCardPayment({ orderId: order.id, orderNumber: order.order_number,
      amount: order.total, attemptKey: locked.attemptKey, card: data.card });
    const { reconcileCardPayment } = await import("@/lib/card-payment-reconcile.server");
    await reconcileCardPayment(order.id, payment);
    const { data: updated } = await context.supabase.from("orders").select("payment_status").eq("id", order.id).eq("user_id", context.userId).single();
    return cardResult({ ...order, payment_status: updated?.payment_status ?? order.payment_status }, payment);
  });

export const cancelPreparedCardOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("cancel_unsubmitted_card_order", { _order_id: data.orderId, _user_id: context.userId });
    if (error) throw new Error("O pagamento já foi iniciado. Aguarde a confirmação.");
    return { cancelled: true };
  });
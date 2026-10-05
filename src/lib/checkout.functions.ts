import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
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
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["pix", "card"]),
  cpf: z.string().regex(/^\d{11}$/, "Informe um CPF válido com 11 dígitos."),
  checkoutKey: z.string().uuid(),
  couponCode: z.string().trim().max(40).optional().default(""),
  items: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});

export interface PendingOrderResult {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  paymentExpiresAt: string;
}

export interface PixOrderResult extends PendingOrderResult {
  pixCopyPaste: string;
  pixQrCodeBase64: string;
  ticketUrl: string;
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
}

const orderIdSchema = z.object({ orderId: z.string().uuid() });

export const getPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => orderIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase.from("orders")
      .select("id, order_number, subtotal, discount, shipping_cost, total, payment_status, payment_expires_at")
      .eq("id", data.orderId).eq("user_id", context.userId).single();
    if (error || !order) throw new Error("Pedido não encontrado.");
    const { data: payments } = await context.supabase.from("payments")
      .select("pix_copy_paste, pix_qr_code_base64, ticket_url, provider_payment_id")
      .eq("order_id", order.id).eq("provider", "mercadopago").limit(1);
    const payment = payments?.[0];
    let paymentStatus = order.payment_status;
    if (order.payment_status === "pending" && payment?.provider_payment_id) {
      try {
        const { getMercadoPagoPayment, paymentSnapshot } = await import("@/lib/mercado-pago.server");
        const livePayment = await getMercadoPagoPayment(payment.provider_payment_id);
        if (livePayment.external_reference === order.id && livePayment.payment_method_id === "pix") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: updateError } = await supabaseAdmin.rpc("apply_mercado_pago_payment", {
            _order_id: order.id,
            _provider_payment_id: String(livePayment.id),
            _provider_status: livePayment.status,
            _amount: livePayment.transaction_amount,
            _raw_payload: paymentSnapshot(livePayment),
          });
          if (updateError) console.error("[pix] status reconciliation failed", updateError);
          else {
            const { data: updated } = await context.supabase.from("orders").select("payment_status")
              .eq("id", order.id).eq("user_id", context.userId).single();
            paymentStatus = updated?.payment_status ?? paymentStatus;
          }
        }
      } catch (error) {
        console.error("[pix] status lookup failed", error);
      }
    }
    return {
      id: order.id, orderNumber: order.order_number, subtotal: order.subtotal,
      discount: order.discount, shipping: order.shipping_cost, total: order.total,
      paymentStatus, paymentExpiresAt: order.payment_expires_at,
      pixCopyPaste: payment?.pix_copy_paste ?? "", pixQrCodeBase64: payment?.pix_qr_code_base64 ?? "",
      ticketUrl: payment?.ticket_url ?? "",
    };
  });

export const createPendingOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.paymentMethod !== "pix") throw new Error("Nesta etapa, escolha PIX.");
    const token = process.env['MERCADO_PAGO_ACCESS_TOKEN'];
    if (!token?.startsWith("APP_USR-")) throw new Error("Para validar o PIX, configure uma credencial de teste do Mercado Pago.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin.rpc("create_pending_order", {
      _user_id: context.userId,
      _customer_name: data.customer.name,
      _customer_email: data.customer.email,
      _customer_phone: data.customer.phone,
      _shipping_address: data.address,
      _shipping_method: data.shippingMethod,
      _payment_method: data.paymentMethod,
      _coupon_code: data.couponCode,
      _items: data.items,
      _checkout_key: data.checkoutKey,
    });

    if (error) {
      console.error("[checkout] create_pending_order failed", error.message);
      throw new Error("Não foi possível criar o pedido. Confira os dados e tente novamente.");
    }

    const pendingOrder = order as unknown as PendingOrderResult;
    const { data: existingPayment } = await supabaseAdmin.from("payments")
      .select("id, provider_payment_id, pix_copy_paste, pix_qr_code_base64, ticket_url")
      .eq("order_id", pendingOrder.id).eq("provider", "mercadopago").maybeSingle();
    if (pendingOrder.paymentStatus !== "pending") {
      throw new Error("Este pedido já foi encerrado. Consulte o histórico ou inicie uma nova compra.");
    }
    if (existingPayment?.pix_copy_paste) {
      return {
        ...pendingOrder,
        pixCopyPaste: existingPayment.pix_copy_paste,
        pixQrCodeBase64: existingPayment.pix_qr_code_base64 ?? "",
        ticketUrl: existingPayment.ticket_url ?? "",
      } satisfies PixOrderResult;
    }

    // A chave deriva do pedido persistido: novas tentativas usam a mesma chave no provedor.
    // Nunca devolva o CPF nem a resposta bruta do provedor ao navegador.
    const { createPixPayment, pixInstructions, paymentSnapshot } = await import("@/lib/mercado-pago.server");
    const words = data.customer.name.trim().split(/\s+/);
    const payment = await createPixPayment({
      orderId: pendingOrder.id,
      orderNumber: pendingOrder.orderNumber,
      amount: pendingOrder.total,
      email: data.customer.email,
      firstName: words[0] ?? data.customer.name,
      lastName: words.slice(1).join(" ") || words[0] || data.customer.name,
      cpf: data.cpf,
      expiresAt: pendingOrder.paymentExpiresAt,
      idempotencyKey: pendingOrder.id,
    });
    if (payment.external_reference !== pendingOrder.id || Number(payment.transaction_amount) !== Number(pendingOrder.total)) {
      throw new Error("A cobrança não corresponde ao pedido. Entre em contato com a loja.");
    }
    const instructions = pixInstructions(payment);
    if (!instructions.copyPaste) throw new Error("PIX criado, mas o código ainda não está disponível. Consulte seu pedido novamente.");
    const { error: saveError } = await supabaseAdmin.from("payments").insert({
      order_id: pendingOrder.id, provider: "mercadopago", provider_payment_id: String(payment.id),
      method: "pix", amount: pendingOrder.total, status: "pending", idempotency_key: pendingOrder.id,
      pix_copy_paste: instructions.copyPaste, pix_qr_code_base64: instructions.qrCodeBase64,
      ticket_url: instructions.ticketUrl, expires_at: pendingOrder.paymentExpiresAt,
      raw_payload: paymentSnapshot(payment),
    });
    if (saveError) {
      const { data: saved } = await supabaseAdmin.from("payments")
        .select("provider_payment_id, pix_copy_paste, pix_qr_code_base64, ticket_url")
        .eq("order_id", pendingOrder.id).eq("provider", "mercadopago").maybeSingle();
      if (saved?.provider_payment_id === String(payment.id) && saved.pix_copy_paste) {
        return { ...pendingOrder, pixCopyPaste: saved.pix_copy_paste,
          pixQrCodeBase64: saved.pix_qr_code_base64 ?? "", ticketUrl: saved.ticket_url ?? "" } satisfies PixOrderResult;
      }
      console.error("[pix] payment save failed", saveError);
      throw new Error("PIX criado, mas não foi possível exibi-lo agora. Consulte seu pedido novamente.");
    }
    return { ...pendingOrder, pixCopyPaste: instructions.copyPaste, pixQrCodeBase64: instructions.qrCodeBase64, ticketUrl: instructions.ticketUrl } satisfies PixOrderResult;
  });
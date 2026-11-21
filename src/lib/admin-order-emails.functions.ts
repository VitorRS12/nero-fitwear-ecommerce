import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AuthedContext = { supabase: SupabaseClient<Database>; userId: string };

async function loadOrderForAdmin(ctx: AuthedContext, orderId: string) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || !isAdmin) throw new Error("Acesso restrito a administradores.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders").select("order_number, customer_name, customer_email, payment_status, shipping_method")
    .eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.payment_status !== "approved") throw new Error("O pedido ainda não foi pago.");
  return order;
}

/** Admin: avisa o cliente que o pedido foi enviado, com o código dos Correios. */
export const sendTrackingEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ orderId: z.string().uuid(), trackingCode: z.string().trim().regex(/^[A-Z]{2}\d{9}[A-Z]{2}$/i, "Código dos Correios inválido") }).parse(input))
  .handler(async ({ context, data }) => {
    const order = await loadOrderForAdmin(context as AuthedContext, data.orderId);
    const code = data.trackingCode.toUpperCase();
    const { sendEmail } = await import("@/lib/email/send.server");
    const { trackingEmail } = await import("@/lib/email/templates");
    const sent = await sendEmail(order.customer_email,
      trackingEmail({ orderNumber: order.order_number, customerName: order.customer_name, trackingCode: code }),
      `nero-tracking-${data.orderId}-${code}`, "pedidos");
    return { sent };
  });

/** Admin: avisa o cliente que o pedido está pronto para retirada. */
export const sendPickupReadyEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const order = await loadOrderForAdmin(context as AuthedContext, data.orderId);
    if (order.shipping_method !== "pickup") throw new Error("Este pedido não é de retirada no local.");
    const { sendEmail } = await import("@/lib/email/send.server");
    const { pickupReadyEmail } = await import("@/lib/email/templates");
    const sent = await sendEmail(order.customer_email,
      pickupReadyEmail({ orderNumber: order.order_number, customerName: order.customer_name }),
      `nero-pickup-${data.orderId}`, "pedidos");
    return { sent };
  });

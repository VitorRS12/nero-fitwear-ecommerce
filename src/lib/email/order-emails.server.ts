import { sendEmail } from "./send.server";
import { orderReceivedEmail, paymentConfirmedEmail, paymentFailedEmail, type OrderSummary } from "./templates";

type Kind = "received" | "paid" | "failed";

async function loadOrder(orderId: string): Promise<{ email: string; summary: OrderSummary } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("order_number, customer_name, customer_email, subtotal, shipping_cost, discount, total, shipping_method")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name, color, size, quantity, total")
    .eq("order_id", orderId);
  return {
    email: order.customer_email,
    summary: {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount),
      total: Number(order.total),
      isPickup: order.shipping_method === "pickup",
      items: (items ?? []).map((i) => ({ name: i.product_name, color: i.color, size: i.size, quantity: i.quantity, total: Number(i.total) })),
    },
  };
}

/** Envia o aviso do pedido. Nunca lança. */
export async function sendOrderEmail(orderId: string, kind: Kind): Promise<void> {
  try {
    const loaded = await loadOrder(orderId);
    if (!loaded) return;
    const { email, summary } = loaded;
    const content =
      kind === "received" ? orderReceivedEmail(summary)
      : kind === "paid" ? paymentConfirmedEmail(summary)
      : paymentFailedEmail(summary);
    await sendEmail(email, content, `nero-${kind}-${orderId}`, "pedidos");
  } catch (error) {
    console.error("[email] order email failed", kind, error instanceof Error ? error.message : "unknown");
  }
}

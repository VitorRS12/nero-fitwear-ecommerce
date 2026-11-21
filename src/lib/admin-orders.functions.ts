import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { FULFILLMENT_STAGES, type FulfillmentStage } from "@/lib/fulfillment-rules";

type AuthedContext = { supabase: SupabaseClient<Database>; userId: string };

async function assertAdmin(ctx: AuthedContext) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error("Não foi possível verificar a permissão.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

export interface KanbanCard {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  receivedAt: string;
  stageEnteredAt: string;
  stage: FulfillmentStage;
  priority: boolean;
  isPickup: boolean;
  trackingCode: string | null;
  paymentStatus: string;
  hasNotes: boolean;
}

export const adminListKanban = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KanbanCard[]> => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data, error } = await ctx.supabase
      .from("order_fulfillments")
      .select("order_id, status, received_at, preparing_at, ready_at, shipped_at, priority, tracking_code, internal_notes, orders!inner(order_number, customer_name, customer_email, total, shipping_method, payment_status, order_items(quantity))")
      .order("received_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("Não foi possível carregar os pedidos.");
    return (data ?? []).map((r) => {
      const o = r.orders as unknown as {
        order_number: string; customer_name: string; customer_email: string; total: number;
        shipping_method: string | null; payment_status: string; order_items: { quantity: number }[];
      };
      const entered = r.status === "preparing" ? r.preparing_at : r.status === "awaiting_shipment" ? r.ready_at : r.status === "shipped" ? r.shipped_at : r.received_at;
      return {
        orderId: r.order_id, orderNumber: o.order_number, customerName: o.customer_name, customerEmail: o.customer_email,
        itemCount: o.order_items.reduce((s, i) => s + i.quantity, 0), total: Number(o.total),
        receivedAt: r.received_at, stageEnteredAt: entered ?? r.received_at, stage: r.status as FulfillmentStage,
        priority: r.priority, isPickup: o.shipping_method === "pickup", trackingCode: r.tracking_code,
        paymentStatus: o.payment_status, hasNotes: !!r.internal_notes,
      };
    });
  });

export const adminGetOrderDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { data: order, error } = await ctx.supabase
      .from("orders")
      .select("id, order_number, created_at, customer_name, customer_email, customer_phone, shipping_address, shipping_method, shipping_cost, subtotal, discount, total, payment_status, payment_method, order_items(id, product_name, sku, color, size, quantity, unit_price, total), order_fulfillments(id, status, carrier, tracking_code, internal_notes, priority, shipped_at, order_fulfillment_events(id, from_status, to_status, note, actor_id, created_at))")
      .eq("id", data.orderId).maybeSingle();
    if (error || !order) throw new Error("Pedido não encontrado.");
    const f = (order.order_fulfillments as unknown as Array<{
      id: string; status: FulfillmentStage; carrier: string | null; tracking_code: string | null; internal_notes: string | null;
      priority: boolean; shipped_at: string | null;
      order_fulfillment_events: { id: string; from_status: string | null; to_status: FulfillmentStage; note: string | null; actor_id: string | null; created_at: string }[];
    }> | null)?.[0] ?? null;
    const actorIds = [...new Set((f?.order_fulfillment_events ?? []).map((e) => e.actor_id).filter(Boolean) as string[])];
    const names: Record<string, string> = {};
    if (actorIds.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const id of actorIds) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        names[id] = (u.user?.user_metadata?.["full_name"] as string | undefined) ?? u.user?.email ?? "Equipe";
      }
    }
    const events = (f?.order_fulfillment_events ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({ id: e.id, toStatus: e.to_status, note: e.note, createdAt: e.created_at, actor: e.actor_id ? names[e.actor_id] ?? "Equipe" : "Sistema" }));
    return {
      id: order.id, orderNumber: order.order_number, createdAt: order.created_at,
      customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
      address: order.shipping_address as Record<string, string> | null, shippingMethod: order.shipping_method,
      items: order.order_items.map((i) => ({ ...i, unit_price: Number(i.unit_price), total: Number(i.total) })),
      subtotal: Number(order.subtotal), discount: Number(order.discount), shippingCost: Number(order.shipping_cost), total: Number(order.total),
      paymentStatus: order.payment_status, paymentMethod: order.payment_method,
      fulfillment: f ? { status: f.status, carrier: f.carrier, trackingCode: f.tracking_code, notes: f.internal_notes ?? "", priority: f.priority } : null,
      events,
    };
  });

export type OrderDetail = Awaited<ReturnType<typeof adminGetOrderDetail>>;

const MOVE_ERRORS: Record<string, string> = {
  invalid_transition: "Movimento não permitido: Enviados não volta atrás e o envio só parte de Aguardando envio.",
  tracking_required: "Informe um código de rastreio válido dos Correios.",
  not_paid: "Este pedido não está com pagamento aprovado.",
  not_found: "Pedido não encontrado no painel.",
};

export const adminMoveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({
    orderId: z.string().uuid(),
    to: z.enum(FULFILLMENT_STAGES),
    trackingCode: z.string().trim().max(20).optional(),
    note: z.string().trim().max(500).optional(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("admin_move_fulfillment", {
      _order_id: data.orderId, _to: data.to, _actor: ctx.userId,
      ...(data.trackingCode ? { _tracking: data.trackingCode } : {}),
      ...(data.note ? { _note: data.note } : {}),
    });
    if (error) throw new Error("Não foi possível mover o pedido.");
    const result = res as { ok: boolean; error?: string };
    if (!result.ok) throw new Error(MOVE_ERRORS[result.error ?? ""] ?? "Movimento não permitido.");

    let emailSent = false;
    if (data.to === "shipped") {
      const { data: order } = await supabaseAdmin.from("orders")
        .select("order_number, customer_name, customer_email, shipping_method").eq("id", data.orderId).maybeSingle();
      if (order) {
        const { sendEmail } = await import("@/lib/email/send.server");
        const t = await import("@/lib/email/templates");
        if (order.shipping_method === "pickup") {
          emailSent = await sendEmail(order.customer_email, t.pickupReadyEmail({ orderNumber: order.order_number, customerName: order.customer_name }), `nero-pickup-${data.orderId}`, "pedidos");
        } else if (data.trackingCode) {
          const code = data.trackingCode.toUpperCase();
          emailSent = await sendEmail(order.customer_email, t.trackingEmail({ orderNumber: order.order_number, customerName: order.customer_name, trackingCode: code }), `nero-tracking-${data.orderId}-${code}`, "pedidos");
        }
      }
    }
    return { ok: true, emailSent };
  });

export const adminUpdateOrderOps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({
    orderId: z.string().uuid(), notes: z.string().max(2000), priority: z.boolean(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("order_fulfillments")
      .update({ internal_notes: data.notes.trim() || null, priority: data.priority, assignee_id: ctx.userId })
      .eq("order_id", data.orderId);
    if (error) throw new Error("Não foi possível salvar as observações.");
    return { ok: true };
  });

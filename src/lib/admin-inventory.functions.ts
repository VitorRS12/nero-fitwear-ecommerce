import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AuthedContext = { supabase: SupabaseClient<Database>; userId: string };

async function assertAdmin(ctx: AuthedContext) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error("Não foi possível verificar a permissão.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

export interface InventoryRow {
  id: string;
  productName: string;
  sku: string;
  color: string | null;
  size: string | null;
  stock: number;
  reservedInOrders: number;
  threshold: number;
  isActive: boolean;
}

export const adminListInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InventoryRow[]> => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const [variants, pending] = await Promise.all([
      ctx.supabase
        .from("product_variants")
        .select("id, sku, color, size, stock, low_stock_threshold, is_active, products ( name )")
        .order("sku"),
      ctx.supabase
        .from("order_items")
        .select("variant_id, quantity, orders!inner ( status, inventory_released_at )")
        .eq("orders.status", "awaiting_payment")
        .is("orders.inventory_released_at", null),
    ]);
    if (variants.error) throw new Error("Não foi possível carregar o estoque.");
    const reserved = new Map<string, number>();
    for (const item of pending.data ?? []) {
      if (item.variant_id) reserved.set(item.variant_id, (reserved.get(item.variant_id) ?? 0) + item.quantity);
    }
    return (variants.data ?? []).map((v) => ({
      id: v.id,
      productName: (v.products as { name: string } | null)?.name ?? "—",
      sku: v.sku,
      color: v.color,
      size: v.size,
      stock: v.stock,
      reservedInOrders: reserved.get(v.id) ?? 0,
      threshold: v.low_stock_threshold,
      isActive: v.is_active,
    }));
  });

const ERRORS: Record<string, string> = {
  invalid_input: "Quantidade inválida.",
  note_required: "Informe o motivo.",
  not_found: "Peça não encontrada.",
  below_reserved: "A contagem não pode ficar abaixo das peças reservadas.",
};

export const adminAdjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        variantId: z.string().uuid(),
        mode: z.enum(["add", "set"]),
        quantity: z.number().int().min(0).max(100000),
        note: z.string().trim().min(1).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("admin_adjust_stock", {
      _variant_id: data.variantId,
      _mode: data.mode,
      _quantity: data.quantity,
      _note: data.note,
    });
    if (error) {
      const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
      throw new Error(key ? ERRORS[key] : "Não foi possível atualizar o estoque.");
    }
    return result as { ok: boolean; stock: number };
  });

export const adminSetLowStockThreshold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ variantId: z.string().uuid(), threshold: z.number().int().min(0).max(10000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as AuthedContext;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("product_variants")
      .update({ low_stock_threshold: data.threshold })
      .eq("id", data.variantId);
    if (error) throw new Error("Não foi possível salvar o limite.");
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware"
import { email, string } from "zod/v4";
import { Card } from "@/components/ui/card";
import { quartersInYear } from "date-fns/constants";

const checkoutSchema = z.object({ 
    customer: z.object({
        name: z.string().trim().min(2). max(120),
        email: z.string().trim().email(). max(200),
        phone: z.string().trim().min(8). max(30),
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
    shippingMethod: z.enum(["standart", "express"]),
    paymentMethod: z.enum(["pix", "card"]),
    couponCode: z.string().trim().max(40).optional().default(""),
    items: z.array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});

export interface PendingOrderResult {
    id: string;
    orderNumber: string;
    subtotal: number;
    discount: number;
    shipping: number;
    paymentSStatus: "pending";
}

export const createPendingOrder = createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((input: unknown) => checkoutSchema.parse(input))
    .handler(async ({ data, context}) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order, error } = await supabaseAdmin.rpc("create_pending_order" as any, {
           _user_id: context.userId,
        _customer_name: data.customer.name,
        _customer_email: data.customer.email,
        _customer_phone: data.customer.phone,
        _shipping_address: data.address,
        _shipping_method: data.shippingMethod,
        _payment_method: data.paymentMethod,
        _coupon_code: data.couponCode,
        _items: data.items, 
        });

        if (error) {
            console.error("[checkout] create_pending_order failed", error.message);
            throw new Error("Não foi possível criar o pedido. Confira os dados e tente novamente.");
        }

        return order as unknown as PendingOrderResult;
    })
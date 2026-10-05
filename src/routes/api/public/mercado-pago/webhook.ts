import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const notificationSchema = z.object({
  data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
  type: z.string().max(60).optional(),
});

export const Route = createFileRoute("/api/public/mercado-pago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-signature") ?? "";
        const requestId = request.headers.get("x-request-id") ?? "";
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid body", { status: 400 });
        }
        const parsed = notificationSchema.safeParse(body);
        if (!parsed.success) return new Response("Invalid notification", { status: 400 });
        const url = new URL(request.url);
        const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
        const dataId = queryId ?? String(parsed.data.data?.id ?? "");
        if (!/^\d{1,30}$/.test(dataId) || !signature || !requestId ||
            (parsed.data.data?.id && String(parsed.data.data.id) !== dataId)) {
          return new Response("Missing or mismatched signature data", { status: 401 });
        }

        const mercadoPago = await import("@/lib/mercado-pago.server");
        const valid = await mercadoPago.verifyMercadoPagoSignature({ signature, requestId, dataId });
        if (!valid) return new Response("Invalid signature", { status: 401 });

        try {
          const payment = await mercadoPago.getMercadoPagoPayment(dataId);
          const orderId = z.string().uuid().parse(payment.external_reference);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.rpc("apply_mercado_pago_payment", {
            _order_id: orderId,
            _provider_payment_id: String(payment.id),
            _provider_status: payment.status,
            _amount: payment.transaction_amount,
            _raw_payload: mercadoPago.paymentSnapshot(payment),
          });
          if (error) throw error;
          return new Response("ok");
        } catch (error) {
          console.error("[mercado-pago-webhook] processing failed", error);
          return new Response("Processing failed", { status: 500 });
        }
      },
    },
  },
});
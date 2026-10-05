import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercado-pago/expire")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['LOVABLE_CRON_SECRET'];
        if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getMercadoPagoPayment, cancelMercadoPagoPayment, paymentSnapshot } = await import("@/lib/mercado-pago.server");
        const { data: orders, error } = await supabaseAdmin.from("orders")
          .select("id, payments(provider_payment_id)")
          .eq("status", "awaiting_payment")
          .eq("payment_status", "pending")
          .is("inventory_released_at", null)
          .lt("payment_expires_at", new Date().toISOString())
          .limit(100);
        if (error) return new Response("Unable to read expired orders", { status: 500 });
        let processed = 0;
        let failed = 0;
        for (const order of orders ?? []) {
          const paymentId = order.payments?.[0]?.provider_payment_id;
          try {
            if (paymentId) {
              let payment = await getMercadoPagoPayment(paymentId);
              if (payment.external_reference !== order.id || payment.payment_method_id !== "pix") throw new Error("Payment reference mismatch");
              if (payment.status === "pending" || payment.status === "in_process") {
                payment = await cancelMercadoPagoPayment(paymentId);
                if (payment.external_reference !== order.id || payment.payment_method_id !== "pix") throw new Error("Cancelled payment reference mismatch");
              }
              const { error: updateError } = await supabaseAdmin.rpc("apply_mercado_pago_payment", {
                _order_id: order.id,
                _provider_payment_id: String(payment.id),
                _provider_status: payment.status,
                _amount: payment.transaction_amount,
                _raw_payload: paymentSnapshot(payment),
              });
              if (updateError) throw updateError;
              if (payment.status !== "approved" && payment.status !== "cancelled" && payment.status !== "rejected") {
                continue;
              }
            } else {
              // A criação pode ter chegado ao provedor antes de ser salva localmente.
              // Sem o ID remoto não há como comprovar o cancelamento: não liberar estoque.
              failed += 1;
              console.error("[pix-expire] payment ID missing; manual reconciliation required", order.id);
              continue;
            }
            processed += 1;
          } catch (error) {
            failed += 1;
            console.error("[pix-expire] order reconciliation failed", order.id, error);
          }
        }
        return Response.json({ processed, failed });
      },
    },
  },
});
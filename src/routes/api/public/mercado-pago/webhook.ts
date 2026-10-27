import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercado-pago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MERCADO_PAGO_WEBHOOK_SECRET"];
        if (!secret) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const raw = await request.text();
        let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const dataId = url.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);

        const { verifyMercadoPagoSignature } = await import("@/lib/mercado-pago-signature");
        const valid = await verifyMercadoPagoSignature({
          secret,
          signatureHeader: request.headers.get("x-signature"),
          requestId: request.headers.get("x-request-id"),
          dataId,
        });
        if (!valid) return new Response("Invalid signature", { status: 401 });

        const topic = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
        if (topic !== "payment" || !dataId) return new Response("ignored", { status: 200 });

        try {
          const { fetchMercadoPagoPayment, applyMercadoPagoPayment } = await import("@/lib/mercado-pago.server");
          // Relê na API: o corpo da notificação nunca é usado como fonte de verdade.
          const payment = await fetchMercadoPagoPayment(dataId);
          await applyMercadoPagoPayment(payment);
          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("[mercado-pago] webhook failed", error instanceof Error ? error.message : "unknown");
          return new Response("Processing failed", { status: 500 });
        }
      },
    },
  },
});

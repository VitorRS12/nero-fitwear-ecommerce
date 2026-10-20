import { createFileRoute } from "@tanstack/react-router";

const HANDLED = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "payment_intent.processing",
  "payment_intent.requires_action",
]);

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        const signature = request.headers.get("stripe-signature");
        if (!secret || !signature) return new Response("Unauthorized", { status: 401 });
        const body = await request.text();
        const { getStripe, applyPaymentIntent } = await import("@/lib/stripe.server");
        const stripe = getStripe();
        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, secret);
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }
        if (!HANDLED.has(event.type)) return new Response("ignored", { status: 200 });
        try {
          const intent = event.data.object as { id: string };
          // Relê do Stripe para usar sempre o estado mais recente.
          const pi = await stripe.paymentIntents.retrieve(intent.id, { expand: ["payment_method"] });
          await applyPaymentIntent(pi);
          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("[stripe] webhook processing failed", event.type, error instanceof Error ? error.message : "unknown");
          return new Response("Processing failed", { status: 500 });
        }
      },
    },
  },
});

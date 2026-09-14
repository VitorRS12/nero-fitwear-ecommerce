import { createFileRoute, Link } from "@tanstack/react-router";

import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — NERO Fitwear" },
      { name: "description", content: "Finalize seu pedido com PIX ou cartão de crédito." },
      { property: "og:title", content: "Checkout — NERO Fitwear" },
      { property: "og:description", content: "Finalize seu pedido com segurança." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Checkout" title="Pagamento em preparação">
        <p className="max-w-lg text-sm text-muted-foreground">
          O pagamento com PIX e cartão será ligado assim que a conta Mercado Pago estiver conectada.
          Enquanto isso, sua sacola fica salva neste dispositivo.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline" className="label-caps">
            <Link to="/carrinho">Voltar para a sacola</Link>
          </Button>
        </div>
      </Section>
    </StoreLayout>
  );
}

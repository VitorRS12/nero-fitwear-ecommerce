import { createFileRoute } from "@tanstack/react-router";

import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/entrega")({
  head: () => ({
    meta: [
      { title: "Entrega e prazos — NERO Fitwear" },
      {
        name: "description",
        content: "Prazos, valores de frete e frete grátis acima de R$ 399 para todo o Brasil.",
      },
      { property: "og:title", content: "Entrega e prazos — NERO Fitwear" },
      { property: "og:description", content: "Como e em quanto tempo seu pedido chega." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/entrega" },
    ],
    links: [{ rel: "canonical", href: "/entrega" }],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Ajuda" title="Entrega e prazos">
        <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Enviamos para todo o Brasil. O prazo começa a contar após a confirmação do pagamento e
            até 2 dias úteis de separação do pedido.
          </p>
          <ul className="space-y-2">
            <li>Sudeste: 2 a 4 dias úteis — a partir de R$ 19,90</li>
            <li>Sul e Centro-Oeste: 3 a 6 dias úteis — a partir de R$ 24,90</li>
            <li>Nordeste: 5 a 9 dias úteis — a partir de R$ 29,90</li>
            <li>Norte: 7 a 12 dias úteis — a partir de R$ 34,90</li>
          </ul>
          <p className="text-foreground">Frete grátis em pedidos acima de R$ 399.</p>
          <p>
            Valores e prazos são estimativas iniciais e serão ajustados quando a transportadora
            oficial for definida.
          </p>
        </div>
      </Section>
    </StoreLayout>
  );
}

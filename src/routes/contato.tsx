import { createFileRoute } from "@tanstack/react-router";

import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — NERO Fitwear" },
      { name: "description", content: "Fale com o time NERO sobre pedidos, trocas e parcerias." },
      { property: "og:title", content: "Contato — NERO Fitwear" },
      { property: "og:description", content: "Fale com o time NERO Fitwear." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Fale com a gente" title="Contato">
        <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>Atendimento de segunda a sexta, das 9h às 18h. Respondemos em até 1 dia útil.</p>
          <p className="text-foreground">
            E-mail e WhatsApp ainda não foram definidos — me envie os contatos oficiais e eu coloco
            aqui.
          </p>
        </div>
      </Section>
    </StoreLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

export const Route = createFileRoute("/trocas")({
  head: () => ({
    meta: [
      { title: "Trocas e devoluções — NERO Fitwear" },
      {
        name: "description",
        content: "Como trocar tamanho ou devolver uma peça NERO em até 30 dias.",
      },
      { property: "og:title", content: "Trocas e devoluções — NERO Fitwear" },
      { property: "og:description", content: "Primeira troca de tamanho sem custo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/trocas" },
    ],
    links: [{ rel: "canonical", href: "/trocas" }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <StoreLayout>
      <Section eyebrow="Ajuda" title="Trocas e devoluções">
        <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Você tem 30 dias corridos, a partir do recebimento, para trocar o tamanho ou devolver a
            peça. A primeira troca de tamanho é por nossa conta.
          </p>
          <ul className="space-y-2">
            <li>A peça precisa estar sem uso, sem odor e com a etiqueta original.</li>
            <li>Peças íntimas só são trocadas com o lacre de higiene intacto.</li>
            <li>Devoluções por arrependimento seguem o prazo legal de 7 dias.</li>
            <li>O reembolso é feito pelo mesmo meio de pagamento em até 10 dias úteis.</li>
          </ul>
          <p>
            Esta política é uma versão inicial e será revisada com o texto jurídico definitivo antes
            do lançamento.
          </p>
        </div>
      </Section>
    </StoreLayout>
  );
}

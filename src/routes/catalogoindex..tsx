import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/blocks/ProductGrid";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { productsQuery } from "@/services/product.service";

interface CatalogSearch {
  busca?: string | undefined;
  novidades?: boolean | undefined;
}

export const Route = createFileRoute("/catalogoindex/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    busca: typeof search["busca"] === "string" && search["busca"] ? search["busca"] : undefined,
    novidades: search["novidades"] === true || search["novidades"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — NERO Fitwear" },
      {
        name: "description",
        content: "Todas as peças NERO: leggings, tops, shorts, camisetas e conjuntos.",
      },
      { property: "og:title", content: "Catálogo — NERO Fitwear" },
      { property: "og:description", content: "Todas as peças NERO em um só lugar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/catalogo" },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { busca, novidades } = Route.useSearch();
  const products = useQuery(
    productsQuery({
      ...(busca ? { search: busca } : {}),
      ...(novidades ? { isNew: true } : {}),
    }),
  );

  return (
    <StoreLayout>
      <Section
        eyebrow="Catálogo"
        title={novidades ? "Lançamentos" : "Todos os produtos"}
        description={busca ? `Resultados para “${busca}”.` : undefined}
      >
        <ProductGrid products={products.data ?? []} isLoading={products.isLoading} />
      </Section>
    </StoreLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductGrid } from "@/components/blocks/ProductGrid";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { categoriesQuery, productsQuery } from "@/services/product.service";

export const Route = createFileRoute("/catalogo/$categoria")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.categoria.replace(/-/g, " ")} — NERO Fitwear` },
      {
        name: "description",
        content: `Peças NERO da categoria ${params.categoria.replace(/-/g, " ")}.`,
      },
      { property: "og:title", content: `${params.categoria.replace(/-/g, " ")} — NERO Fitwear` },
      { property: "og:description", content: "Tecido técnico e modelagem real para treinar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `/catalogo/${params.categoria}` },
    ],
    links: [{ rel: "canonical", href: `/catalogo/${params.categoria}` }],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productsQuery({ category: params.categoria })),
  component: CategoryPage,
});

function CategoryPage() {
  const { categoria } = Route.useParams();
  const products = useQuery(productsQuery({ category: categoria }));
  const { data: categories = [] } = useQuery(categoriesQuery());
  const category = categories.find((item) => item.slug === categoria);

  return (
    <StoreLayout>
      <Section
        eyebrow="Catálogo"
        title={category?.name ?? categoria.replace(/-/g, " ")}
        description={category?.description ?? undefined}
      >
        <ProductGrid products={products.data ?? []} isLoading={products.isLoading} />
      </Section>
    </StoreLayout>
  );
}

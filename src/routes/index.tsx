import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { CategoryExplorer } from "@/components/blocks/CatergoryExplorer";
import { FeatureSection } from "@/components/blocks/FeatureSection";
import { Hero } from "@/components/blocks/Hero";
import { Newsletter } from "@/components/blocks/Newsletter";
import { ProductGrid } from "@/components/blocks/ProductGrid";
import { PromotionalBanner } from "@/components/blocks/PromotionalBanner";
import { Section } from "@/components/blocks/Section";
import { Testimonials } from "@/components/blocks/Testimonials";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { findSlot, homeMediaQuery } from "@/services/home-media.service";
import { categoriesQuery, productsQuery } from "@/services/product.service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NERO Fitwear — Roupas fitness de alta performance" },
      {
        name: "description",
        content:
          "Leggings, tops, shorts e camisetas com tecido técnico, compressão real e caimento premium. Frete grátis acima de R$ 399.",
      },
      { property: "og:title", content: "NERO Fitwear — Roupas fitness de alta performance" },
      {
        property: "og:description",
        content: "Tecido técnico, modelagem real e durabilidade para treino pesado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(productsQuery({ featured: true, limit: 8 })),
      context.queryClient.ensureQueryData(homeMediaQuery()),
    ]);
  },
  component: HomePage,
});

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const featured = useSuspenseQuery(productsQuery({ featured: true, limit: 8 }));
  const novelties = useQuery(productsQuery({ isNew: true, limit: 4 }));
  const { data: homeMedia } = useSuspenseQuery(homeMediaQuery());
  const heroMedia = findSlot(homeMedia, "hero");
  const bannerMedia = findSlot(homeMedia, "banner");

  return (
    <StoreLayout>
      <Hero
        title={"Treine\npesado"}
        subtitle="Peças técnicas feitas para suportar o seu limite: compressão que sustenta, tecido que respira e modelagem que acompanha o movimento."
        imageUrl={heroMedia?.url ?? null}
        focalX={heroMedia?.focal_x}
        focalY={heroMedia?.focal_y}
      />

      <FeatureSection />

      {categories.length > 0 ? (
        <Section
          eyebrow="Categorias"
          title="Escolha seu treino"
          description="Do levantamento ao asfalto: cada categoria foi desenvolvida para um tipo de esforço."
        >
          <CategoryExplorer categories={categories.slice(0, 4)} />
        </Section>
      ) : null}

      <Section
        eyebrow="Mais vendidos"
        title="Destaques"
        action={
          <Button variant="outline" asChild className="label-caps">
            <Link to="/catalogo">Ver tudo</Link>
          </Button>
        }
      >
        <ProductGrid products={featured.data} />
      </Section>

      <PromotionalBanner
        title={"Coleção\nConcrete"}
        description="Preto, grafite e areia. Peças atemporais que combinam entre si e aguentam o ano inteiro de treino."
        imageUrl={bannerMedia?.url ?? null}
        focalX={bannerMedia?.focal_x}
        focalY={bannerMedia?.focal_y}
      />

      <Section
        eyebrow="Acabou de chegar"
        title="Lançamentos"
        action={
          <Button variant="outline" asChild className="label-caps">
            <Link to="/catalogo" search={{ novidades: true }}>
              Ver lançamentos
            </Link>
          </Button>
        }
      >
        <ProductGrid
          products={novelties.data ?? []}
          isLoading={novelties.isLoading}
          emptyMessage="Novos lançamentos em breve."
        />
      </Section>

      <Testimonials />
      <Newsletter />
    </StoreLayout>
  );
}

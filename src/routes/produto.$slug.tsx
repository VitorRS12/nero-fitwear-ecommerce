import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductGallery } from "@/components/blocks/ProductGallery";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";

import { Button } from "@/components/ui/button";
import { discountPercent, effectivePrice, formatCurrency, hasDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { productQuery } from "@/services/product.service";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    return null;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — NERO Fitwear` },
      { name: "description", content: "Peça técnica NERO Fitwear com compressão e caimento premium." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — NERO Fitwear` },
      { property: "og:description", content: "Peça técnica NERO Fitwear." },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/produto/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/produto/${params.slug}` }],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <StoreLayout>
      <Section title="Produto não encontrado">
        <p className="text-sm text-muted-foreground">
          Essa peça saiu do ar.{" "}
          <Link to="/catalogo" className="text-accent underline">
            Ver o catálogo
          </Link>
        </p>
      </Section>
    </StoreLayout>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { addItem } = useCart();

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  const variants = product?.product_variants ?? [];
  const colors = useMemo(
    () =>
      Array.from(
        new Map(
          variants.filter((v) => v.color).map((v) => [v.color as string, v.color_hex ?? "#8A8A8A"]),
        ),
      ),
    [variants],
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.filter((v) => v.size).map((v) => v.size as string))),
    [variants],
  );

  if (!product) return <ProductNotFound />;

  const selectedColor = color ?? colors[0]?.[0] ?? null;
  const variant = variants.find((v) => v.color === selectedColor && v.size === size) ?? null;
  const allImages = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  const colorImages = allImages.filter((image) => image.color === selectedColor);
  const images = colorImages.length > 0 ? colorImages : allImages;

  const price = effectivePrice(product, variant?.price);

  const stockForSize = (value: string) =>
    variants.find((v) => v.color === selectedColor && v.size === value)?.stock ?? 0;

  const handleAdd = () => {
    if (!size || !variant) {
      toast.error("Escolha um tamanho para continuar.");
      return;
    }
    if (variant.stock < 1) {
      toast.error("Esse tamanho está esgotado.");
      return;
    }
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      imageUrl: variant.image_url ?? images[0]?.url ?? null,
      unitPrice: price,
      quantity: 1,
      maxStock: variant.stock,
    });
    toast.success("Adicionado à sacola.");
  };

  return (
    <StoreLayout>
      <div className="container-nero grid gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={images} alt={product.name} />
        </div>


        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl">{product.name}</h1>
            {product.short_description ? (
              <p className="text-sm text-muted-foreground">{product.short_description}</p>
            ) : null}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatCurrency(price)}</span>
              {hasDiscount(product) ? (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.base_price)}
                  </span>
                  <span className="label-caps bg-accent px-2 py-1 text-accent-foreground">
                    -{discountPercent(product)}%
                  </span>
                </>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Em até 12x sem juros no cartão ou 5% de desconto no PIX.
            </p>
          </div>

          {colors.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="label-caps">Cor: {selectedColor}</legend>
              <div className="flex flex-wrap gap-2">
                {colors.map(([name, hex]) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={selectedColor === name}
                    onClick={() => {
                      setColor(name);
                      setSize(null);
                    }}
                    className={cn(
                        "size-9 rounded-full border-2 transition-[border-color,transform] duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none",
                        selectedColor === name ? "scale-110 border-accent" : "border-border",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          {sizes.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="label-caps">Tamanho</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((value) => {
                  const stock = stockForSize(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={stock < 1}
                      aria-pressed={size === value}
                      aria-label={`Tamanho ${value}${stock < 1 ? ", esgotado" : ""}`}
                      onClick={() => setSize(value)}
                      className={cn(
                        "min-w-14 border px-4 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none",
                        size === value
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-foreground",
                        stock < 1 && "cursor-not-allowed opacity-30 line-through",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <Button size="lg" className="label-caps w-full" onClick={handleAdd}>
            Adicionar à sacola
          </Button>

          {product.description ? (
            <div className="space-y-2 border-t border-border pt-8">
              <h2 className="text-2xl">Detalhes</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </StoreLayout>
  );
}

import { Link } from "@tanstack/react-router";

import { ProductThumb } from "@/components/shared/ProductThumb";
import { discountPercent, formatCurrency, hasDiscount } from "@/lib/format";
import type { ProductSummary } from "@/types/catalog";

interface ProductCardProps {
  product: ProductSummary;
  priority?: boolean | undefined;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const sorted = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  const image = sorted[0];
  const hoverImage = sorted[1];

  const colors = Array.from(
    new Map(
      (product.product_variants ?? [])
        .filter((variant) => variant.color)
        .map((variant) => [variant.color, variant.color_hex ?? "#8A8A8A"] as const),
    ),
  );
  const totalStock = (product.product_variants ?? []).reduce(
    (sum, variant) => sum + variant.stock,
    0,
  );
  const price = product.sale_price ?? product.base_price;

  return (
    <article className="group">
      <Link
        to="/produto/$slug"
        params={{ slug: product.slug }}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-graphite">
          <ProductThumb
            url={image?.url}
            alt={image?.alt ?? product.name}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          {hoverImage ? (
            <img
              src={hoverImage.url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.is_new ? (
              <span className="label-caps bg-foreground px-2 py-1 text-background">Novo</span>
            ) : null}
            {hasDiscount(product) ? (
              <span className="label-caps bg-accent px-2 py-1 text-accent-foreground">
                -{discountPercent(product)}%
              </span>
            ) : null}
            {totalStock === 0 ? (
              <span className="label-caps bg-secondary px-2 py-1 text-secondary-foreground">
                Esgotado
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-1 pt-4">
          <h3 className="text-lg leading-tight">{product.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{formatCurrency(price)}</span>
            {hasDiscount(product) ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.base_price)}
              </span>
            ) : null}
          </div>
          {colors.length > 0 ? (
            <ul className="flex items-center gap-1.5 pt-1" aria-label="Cores disponíveis">
              {colors.map(([color, hex]) => (
                <li
                  key={color}
                  title={color ?? undefined}
                  className="size-3 rounded-full border border-border"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

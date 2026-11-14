import { Link } from "@tanstack/react-router";

import { ProductThumb } from "@/components/shared/ProductThumb";
import type { Category } from "@/types/catalog";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to="/catalogo/$categoria"
      params={{ categoria: category.slug }}
      className="group relative block aspect-[4/5] overflow-hidden bg-graphite focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <ProductThumb
        url={category.image_url}
        alt={category.name}
        focalX={category.focal_x}
        focalY={category.focal_y}
        className="transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
        <h3 className="text-2xl">{category.name}</h3>
        {category.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
        ) : null}
      </div>
    </Link>
  );
}

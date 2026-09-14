import { ProductCard } from "@/components/blocks/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/catalog";

interface ProductGridProps {
  products: ProductSummary[];
  isLoading?: boolean | undefined;
  emptyMessage?: string | undefined;
  className?: string | undefined;
}

export function ProductGrid({
  products,
  isLoading,
  emptyMessage = "Nenhum produto encontrado com esses filtros.",
  className,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4", className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border border-dashed border-border py-20 text-center">
        <p className="label-caps text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4", className)}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

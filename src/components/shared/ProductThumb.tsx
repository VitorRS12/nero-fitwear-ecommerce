import { cn } from "@/lib/utils";

interface ProductThumbProps {
  url?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  sizes?: string | undefined;
  priority?: boolean | undefined;
}

/**
 * Imagem de produto com fallback de marca (usado enquanto as fotos
 * oficiais não são carregadas no Storage).
 */
export function ProductThumb({ url, alt, className, sizes, priority }: ProductThumbProps) {
  if (!url) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-full w-full items-center justify-center bg-graphite text-muted-foreground",
          className,
        )}
      >
        <span className="font-display text-4xl opacity-30">nero</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

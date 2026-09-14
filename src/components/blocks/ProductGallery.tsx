import { useEffect, useState } from "react";

import { ProductThumb } from "@/components/shared/ProductThumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/catalog";

interface ProductGalleryProps {
  images: ProductImage[];
  alt: string;
}

/** Slide de fotos da peça com miniaturas sincronizadas. */
export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const firstImageId = images[0]?.id;

  useEffect(() => {
    if (api) api.scrollTo(0);
  }, [api, images.length, firstImageId]);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] overflow-hidden bg-graphite">
        <ProductThumb alt={alt} priority />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="group relative">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image.id}>
              <div className="aspect-[3/4] overflow-hidden bg-graphite">
                <ProductThumb
                  url={image.url}
                  alt={image.alt ?? alt}
                  priority={index === 0}
                  className="transition-transform duration-500 hover:scale-105"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 ? (
          <>
            <CarouselPrevious className="left-3 opacity-0 transition-opacity group-hover:opacity-100" />
            <CarouselNext className="right-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </>
        ) : null}
      </Carousel>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                aria-label={`Ver foto ${index + 1}`}
                aria-current={current === index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "block aspect-[3/4] w-full overflow-hidden border bg-graphite transition-colors",
                  current === index ? "border-foreground" : "border-transparent opacity-60",
                )}
              >
                <ProductThumb url={image.url} alt={image.alt ?? alt} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

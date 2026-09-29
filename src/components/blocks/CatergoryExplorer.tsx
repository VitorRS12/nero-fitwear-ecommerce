import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { ProductThumb } from "@/components/shared/ProductThumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/catalog";

/** Uma seleção controla simultaneamente a descrição, o link e a fotografia. */
export function CategoryExplorer({ categories }: { categories: Category[] }) {
  const initialId =
    categories.find((category) => category.image_url)?.id ?? categories[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const activeId = categories.some((category) => category.id === selectedId)
    ? selectedId
    : initialId;

  if (categories.length === 0) return null;

  return (
    <div className="category-explorer grid gap-0 border border-line-subtle bg-surface lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="relative aspect-4/5 overflow-hidden bg-graphite sm:aspect-5/4 lg:aspect-auto lg:min-h-740px]">
        {categories.map((category) => (
          <div
            key={category.id}
            aria-hidden="true"
            className={`category-explorer-image absolute inset-0 transition-opacity duration-700 ease-out ${activeId === category.id ? "z-10 opacity-100" : "opacity-0"}`}
          >
            <ProductThumb
              url={category.image_url}
              alt={category.name}
              focalX={category.focal_x}
              focalY={category.focal_y}
              priority={category.id === initialId}
            />
          </div>
        ))}
        <div aria-hidden="true" className="pointer-events-none absolute inset-4 z-20 border border-foreground/25 sm:inset-6 lg:inset-8" />
      </div>

      <Accordion
        type="single"
        value={activeId}
        onValueChange={(value) => {
          if (value) setSelectedId(value);
        }}
        className="flex min-w-0 flex-col border-t border-line-subtle lg:border-l lg:border-t-0"
      >
        {categories.map((category, index) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="group/item min-w-0 border-b border-line-subtle last:border-b-0 data-[state=open]:bg-elevated"
          >
            <AccordionTrigger className="min-h-20 gap-4 px-5 py-5 text-left no-underline hover:no-underline focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset--2px focus-visible:outline-ring sm:px-8 [&>svg]:size-5 [&>svg]:text-foreground [&>svg]:group-hover/item:translate-x-1 [&>svg]:motion-reduce:transform-none">
              <span className="flex min-w-0 flex-1 items-baseline gap-5 sm:gap-7">
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 wrap-break-word font-display text-3xl leading-none text-foreground transition-transform duration-300 group-hover/item:translate-x-1 motion-reduce:transform-none sm:text-4xl">
                  {category.name}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-8 pl-12 pr-5 pt-0 sm:pl-19 sm:pr-8 motion-reduce:animate-none">
              {category.description ? (
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {category.description}
                </p>
              ) : null}
              <Button asChild size="lg" className="label-caps max-w-full">
                <Link to="/catalogo/$categoria" params={{ categoria: category.slug }}>
                  <span className="truncate">Explorar {category.name}</span>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

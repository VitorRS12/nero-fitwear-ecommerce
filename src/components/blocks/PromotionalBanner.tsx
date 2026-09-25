import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

interface PromotionalBannerProps {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  ctaLabel?: string | undefined;
  imageUrl?: string | null | undefined;
  focalX?: number | undefined;
  focalY?: number | undefined;
}

export function PromotionalBanner({
  eyebrow = "Coleção Concrete",
  title,
  description,
  ctaLabel = "Explorar coleção",
  imageUrl,
  focalX = 50,
  focalY = 50,
}: PromotionalBannerProps) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-graphite">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />
      ) : null}
      <div className="container-nero relative flex min-h-[420px] items-center py-16">
        <div className="max-w-xl space-y-5">
          <p className="label-caps text-accent">{eyebrow}</p>
          <h2 className="whitespace-pre-line text-5xl sm:text-7xl">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          <Button size="lg" asChild className="label-caps">
            <Link to="/catalogo">{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

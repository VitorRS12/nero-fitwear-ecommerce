import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

interface HeroProps {
  eyebrow?: string | undefined;
  title: string;
  subtitle?: string | undefined;
  primaryLabel?: string | undefined;
  primaryTo?: string | undefined;
  secondaryLabel?: string | undefined;
  imageUrl?: string | null | undefined;
  focalX?: number | undefined;
  focalY?: number | undefined;
}

export function Hero({
  eyebrow = "Nova coleção",
  title,
  subtitle,
  primaryLabel = "Comprar agora",
  secondaryLabel = "Ver lançamentos",
  imageUrl,
  focalX = 50,
  focalY = 50,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-graphite">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-70 sm:opacity-55"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10 sm:bg-gradient-to-r sm:from-background/90 sm:via-background/50 sm:to-transparent" aria-hidden="true" />

      <div className="container-nero relative grid min-h-[85svh] items-end pb-12 pt-24 sm:min-h-[70vh] sm:items-center sm:py-20">
        <div className="max-w-3xl space-y-6">
          <p className="label-caps text-accent">{eyebrow}</p>
          <h1 className="whitespace-pre-line break-words text-5xl leading-[0.9] sm:text-8xl lg:text-9xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{subtitle}</p>
          ) : null}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild className="label-caps w-full sm:w-auto">
              <Link to="/catalogo">{primaryLabel}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="label-caps w-full sm:w-auto">
              <Link to="/catalogo" search={{ novidades: true }}>
                {secondaryLabel}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

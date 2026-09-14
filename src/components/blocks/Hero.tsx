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
}

export function Hero({
  eyebrow = "Nova coleção",
  title,
  subtitle,
  primaryLabel = "Comprar agora",
  secondaryLabel = "Ver lançamentos",
  imageUrl,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-graphite">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : null}
      <div className="absolute inset-0 bg-background/40" aria-hidden="true" />

      <div className="container-nero relative grid min-h-[70vh] items-center py-20">
        <div className="max-w-3xl space-y-6">
          <p className="label-caps text-accent">{eyebrow}</p>
          <h1 className="whitespace-pre-line text-6xl leading-[0.9] sm:text-8xl lg:text-9xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{subtitle}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild className="label-caps">
              <Link to="/catalogo">{primaryLabel}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="label-caps">
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

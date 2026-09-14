import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps {
  eyebrow?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  id?: string | undefined;
}

/** Bloco base: título de seção + conteúdo. Reutilizado por todos os blocos. */
export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20", className)}>
      <div className="container-nero">
        {(eyebrow || title || action) && (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              {eyebrow ? <p className="label-caps text-accent">{eyebrow}</p> : null}
              {title ? <h2 className="text-4xl sm:text-5xl">{title}</h2> : null}
              {description ? (
                <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

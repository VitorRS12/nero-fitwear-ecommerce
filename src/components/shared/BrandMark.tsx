import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string | undefined;
}

/**
 * Assinatura tipográfica provisória da marca.
 * Substituir pelo logo oficial (SVG) assim que o arquivo for enviado —
 * este é o único ponto do código que precisará mudar.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-end gap-1.5", className)}>
      <img src="/brand/nero-mark.png" alt="Nero Fitwear" className="h-6 w-auto object-contain" />
      <img
        src="/brand/nero-fitwear-logo.png"
        alt=""
        aria-hidden
        className="mb-[9px] h-2 w-auto object-contain"
      />
    </span>
  );
}

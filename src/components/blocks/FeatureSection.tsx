import { CreditCard, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: Truck,
    title: "Frete grátis",
    description: "Em pedidos acima de R$ 399 para todo o Brasil.",
  },
  { icon: RefreshCw, title: "Troca fácil", description: "30 dias para trocar tamanho sem custo." },
  { icon: CreditCard, title: "PIX e cartão", description: "Até 12x no cartão ou 5% off no PIX." },
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Pagamento processado pelo Mercado Pago.",
  },
];

export function FeatureSection({ features = DEFAULT_FEATURES }: { features?: Feature[] }) {
  return (
    <section className="border-y border-border bg-graphite">
      <div className="container-nero grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4">
            <feature.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

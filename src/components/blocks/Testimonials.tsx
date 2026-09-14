import { Section } from "@/components/blocks/Section";

interface Testimonial {
  quote: string;
  author: string;
  detail: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote: "A legging não desce no agachamento e o tecido não fica transparente. Finalmente.",
    author: "Marina S.",
    detail: "Legging Performance",
  },
  {
    quote: "Sustentação de verdade para corrida longa. Comprei mais dois no mês seguinte.",
    author: "Camila R.",
    detail: "Top Force",
  },
  {
    quote: "Modelagem impecável e caimento premium. Vale cada real.",
    author: "Bruno A.",
    detail: "Camiseta Oversized",
  },
];

export function Testimonials({ items = DEFAULT_TESTIMONIALS }: { items?: Testimonial[] }) {
  return (
    <Section eyebrow="Quem treina com NERO" title="Depoimentos">
      <ul className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.author} className="border border-border bg-card p-6">
            <blockquote className="text-sm leading-relaxed text-foreground">
              “{item.quote}”
            </blockquote>
            <footer className="mt-5 space-y-1">
              <p className="label-caps">{item.author}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </footer>
          </li>
        ))}
      </ul>
    </Section>
  );
}

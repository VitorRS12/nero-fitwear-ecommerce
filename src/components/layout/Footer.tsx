import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

import { BrandMark } from "@/components/shared/BrandMark";
import type { Category } from "@/types/catalog";

interface FooterProps {
  categories: Category[];
}

export function Footer({ categories }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-border bg-graphite">
      <div className="container-nero grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-xs text-sm text-muted-foreground">
            Roupas fitness feitas para força, foco e liberdade. Tecidos técnicos, modelagem real,
            durabilidade de treino pesado.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <Instagram className="size-4" aria-hidden="true" />
            @nerofitwear
          </a>
        </div>

        <nav aria-label="Comprar" className="space-y-3">
          <h2 className="label-caps text-accent">Comprar</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/catalogo" className="text-muted-foreground hover:text-foreground">
                Todos os produtos
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to="/catalogo/$categoria"
                  params={{ categoria: category.slug }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Ajuda" className="space-y-3">
          <h2 className="label-caps text-accent">Ajuda</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/entrega" className="text-muted-foreground hover:text-foreground">
                Entrega e prazos
              </Link>
            </li>
            <li>
              <Link to="/trocas" className="text-muted-foreground hover:text-foreground">
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link to="/contato" className="text-muted-foreground hover:text-foreground">
                Contato
              </Link>
            </li>
            <li>
              <Link to="/conta" className="text-muted-foreground hover:text-foreground">
                Meus pedidos
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="label-caps text-accent">Pagamento</h2>
          <p className="text-sm text-muted-foreground">
            PIX e cartão de crédito em até 12x, processados com segurança pelo Mercado Pago.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-nero flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NERO Fitwear. Todos os direitos reservados.</p>
          <p className="label-caps">Força · Foco · Liberdade</p>
        </div>
      </div>
    </footer>
  );
}

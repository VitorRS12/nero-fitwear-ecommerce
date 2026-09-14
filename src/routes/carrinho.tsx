import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProductThumb } from "@/components/shared/ProductThumb";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Sacola — NERO Fitwear" },
      { name: "description", content: "Revise as peças da sua sacola e finalize a compra." },
      { property: "og:title", content: "Sacola — NERO Fitwear" },
      { property: "og:description", content: "Revise as peças da sua sacola." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/carrinho" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/carrinho" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, totals, isHydrated, updateQuantity, removeItem } = useCart();

  if (isHydrated && items.length === 0) {
    return (
      <StoreLayout>
        <Section title="Sua sacola está vazia">
          <p className="mb-6 text-sm text-muted-foreground">
            Escolha suas peças e volte aqui para finalizar.
          </p>
          <Button asChild size="lg" className="label-caps">
            <Link to="/catalogo">Ver produtos</Link>
          </Button>
        </Section>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Section eyebrow="Checkout" title="Sua sacola">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-5">
                <Link
                  to="/produto/$slug"
                  params={{ slug: item.productSlug }}
                  className="size-24 shrink-0 overflow-hidden bg-graphite"
                >
                  <ProductThumb url={item.imageUrl} alt={item.productName} />
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg leading-tight">{item.productName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {[item.color, item.size].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        className="p-2 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        className="p-2 disabled:opacity-30"
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-4 border border-border bg-card p-6">
            <h2 className="text-2xl">Resumo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatCurrency(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-accent">
                  <dt>Desconto</dt>
                  <dd>-{formatCurrency(totals.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd className="text-muted-foreground">Calculado no checkout</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
            <Button size="lg" className="label-caps w-full" asChild>
              <Link to="/checkout">Finalizar compra</Link>
            </Button>
            <Link
              to="/catalogo"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </Section>
    </StoreLayout>
  );
}

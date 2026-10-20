import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/types/cart";

export interface SummaryData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  shippingLabel?: string | undefined;
  address?: undefined | { street: string; number: string; complement?: string | undefined; neighborhood: string; city: string; state: string; zipCode: string };
}

export function OrderSummary({ data, total }: { data: SummaryData; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="h-fit border border-border bg-card lg:sticky lg:top-24">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center justify-between p-5 text-left lg:pointer-events-none">
        <span className="label-caps text-sm">Resumo do pedido</span>
        <span className="flex items-center gap-2 text-sm"><strong>{formatCurrency(total)}</strong>
          <ChevronDown className={`h-4 w-4 transition-transform lg:hidden ${open ? "rotate-180" : ""}`} aria-hidden /></span>
      </button>
      <div className={`${open ? "block" : "hidden"} space-y-5 border-t border-border p-5 lg:block`}>
        <ul className="space-y-4">
          {data.items.map((item) => (
            <li key={item.variantId} className="flex gap-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden border border-border bg-background">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="flex flex-1 justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">{[item.color, item.size].filter(Boolean).join(" · ")} · {item.quantity}x</p>
                </div>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <Row label="Subtotal" value={formatCurrency(data.subtotal)} />
          {data.discount > 0 ? <Row label="Desconto" value={`-${formatCurrency(data.discount)}`} /> : null}
          <Row label={data.shippingLabel ? `Frete · ${data.shippingLabel}` : "Frete"} value={data.shipping === 0 ? "Grátis" : formatCurrency(data.shipping)} />
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div>
        </dl>
        {data.address ? (
          <div className="border-t border-border pt-4 text-sm">
            <p className="label-caps mb-1 text-xs text-muted-foreground">Entrega</p>
            <p>{data.address.street}, {data.address.number}{data.address.complement ? ` — ${data.address.complement}` : ""}</p>
            <p className="text-muted-foreground">{data.address.neighborhood} · {data.address.city}/{data.address.state} · {data.address.zipCode}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>;
}

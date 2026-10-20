import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StripeCheckout } from "@/components/forms/StripeCheckout";
import { Section } from "@/components/blocks/Section";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getStripeOrder, startStripeCheckout, type StripeOrder } from "@/lib/checkout.functions";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";
import { availableShipping, checkoutTotal, PICKUP_ADDRESS } from "@/services/checkout.service";

const PENDING_KEY = "nero.stripe.pendingOrder";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — NERO Fitwear" },
      { name: "description", content: "Finalize seu pedido com PIX, cartão de crédito ou débito, direto na loja." },
      { property: "og:title", content: "Checkout — NERO Fitwear" },
      { property: "og:description", content: "Finalize seu pedido com segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, coupon, totals, clear } = useCart();
  const start = useServerFn(startStripeCheckout);
  const fetchOrder = useServerFn(getStripeOrder);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState({
    zipCode: "", state: "", city: "", neighborhood: "", street: "", number: "", complement: "",
  });
  const shippingOptions = useMemo(
    () => availableShipping(address.state, totals.subtotal),
    [address.state, totals.subtotal],
  );
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<StripeOrder | null>(null);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("pedido") ?? window.localStorage.getItem(PENDING_KEY);
    if (!id) return;
    fetchOrder({ data: { orderId: id } })
      .then((result) => {
        if (result.paymentStatus === "pending" || result.paymentStatus === "rejected" || params.get("pedido")) setOrder(result);
        else window.localStorage.removeItem(PENDING_KEY);
      })
      .catch(() => window.localStorage.removeItem(PENDING_KEY));
  }, [fetchOrder]);

  const onPaid = useCallback(() => { clear(); window.localStorage.removeItem(PENDING_KEY); }, [clear]);
  const onBack = useCallback(() => { window.localStorage.removeItem(PENDING_KEY); setOrder(null); setCheckoutKey(null); }, []);

  const selectedShipping = shippingOptions.find((option) => option.id === shippingMethod);
  const isPickup = shippingMethod === "pickup";
  const previewTotal = checkoutTotal(totals.subtotal, totals.discount, selectedShipping?.price ?? 0);

  const updateCustomer = (field: keyof typeof customer, value: string) =>
    setCustomer((current) => ({ ...current, [field]: value }));
  const updateAddress = (field: keyof typeof address, value: string) =>
    setAddress((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedShipping) {
      toast.error("Informe um estado válido para calcular o frete.");
      return;
    }
    setSubmitting(true);
    try {
      const key = checkoutKey ?? crypto.randomUUID();
      setCheckoutKey(key);
      const created = await start({ data: {
        customer, address: isPickup ? PICKUP_ADDRESS : address,
        shippingMethod: shippingMethod as "standard" | "express" | "pickup",
        checkoutKey: key,
        couponCode: coupon?.code ?? "",
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      } });
      window.localStorage.setItem(PENDING_KEY, created.id);
      setOrder(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    const hasAddress = isPickup || Boolean(address.street);
    const summaryAddress = isPickup ? PICKUP_ADDRESS : address;
    return <StoreLayout><Section eyebrow="Pagamento" title="Finalizar pagamento">
      <StripeCheckout initialOrder={order} onPaid={onPaid} onBack={onBack} summary={{
        items, subtotal: totals.subtotal, discount: totals.discount,
        shipping: selectedShipping?.price ?? 0, shippingLabel: selectedShipping?.label,
        address: hasAddress ? summaryAddress : undefined,
      }} />
    </Section></StoreLayout>;
  }


  if (items.length === 0) {
    return (
      <StoreLayout>
        <Section title="Sua sacola está vazia">
          <Button asChild className="label-caps"><Link to="/catalogo">Ver produtos</Link></Button>
        </Section>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Section eyebrow="Checkout" title="Finalizar compra">
        <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <fieldset className="space-y-4">
              <legend className="mb-4 text-2xl">Seus dados</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Nome completo" value={customer.name} onChange={(value) => updateCustomer("name", value)} autoComplete="name" />
                <Field id="email" label="E-mail" type="email" value={customer.email} onChange={(value) => updateCustomer("email", value)} autoComplete="email" />
                <Field id="phone" label="Telefone" value={customer.phone} onChange={(value) => updateCustomer("phone", value)} autoComplete="tel" />
              </div>
            </fieldset>

            <ChoiceGroup title="Entrega" value={shippingMethod} onValueChange={setShippingMethod}>
              {shippingOptions.map((option) => (
                <Choice key={option.id} id={`shipping-${option.id}`} value={option.id}
                  label={option.id === "pickup" ? option.label : `${option.label} · ${option.etaDays} dias úteis`}
                  detail={option.price === 0 ? "Grátis" : formatCurrency(option.price)} />
              ))}
              {shippingOptions.length === 1 ? <p className="text-sm text-muted-foreground">Informe a UF do endereço para ver as opções de entrega.</p> : null}
            </ChoiceGroup>

            {isPickup ? (
              <div className="border border-border bg-card p-5 text-sm" aria-live="polite">
                <p className="label-caps mb-2 text-xs text-muted-foreground">Endereço de retirada</p>
                <p className="font-medium">{PICKUP_ADDRESS.street}, {PICKUP_ADDRESS.number} — {PICKUP_ADDRESS.complement}</p>
                <p className="text-muted-foreground">{PICKUP_ADDRESS.neighborhood} · {PICKUP_ADDRESS.city}/{PICKUP_ADDRESS.state} · CEP {PICKUP_ADDRESS.zipCode}</p>
                <p className="mt-2 text-muted-foreground">Avisaremos quando o pedido estiver pronto para retirada.</p>
              </div>
            ) : (
            <fieldset className="space-y-4">
              <legend className="mb-4 text-2xl">Endereço de entrega</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="zipCode" label="CEP" value={address.zipCode} onChange={(value) => updateAddress("zipCode", value)} autoComplete="postal-code" />
                <Field id="state" label="Estado (UF)" value={address.state} onChange={(value) => updateAddress("state", value.toUpperCase().slice(0, 2))} maxLength={2} />
                <Field id="city" label="Cidade" value={address.city} onChange={(value) => updateAddress("city", value)} autoComplete="address-level2" />
                <Field id="neighborhood" label="Bairro" value={address.neighborhood} onChange={(value) => updateAddress("neighborhood", value)} />
                <Field id="street" label="Rua" value={address.street} onChange={(value) => updateAddress("street", value)} autoComplete="street-address" />
                <Field id="number" label="Número" value={address.number} onChange={(value) => updateAddress("number", value)} />
                <Field id="complement" label="Complemento (opcional)" value={address.complement} onChange={(value) => updateAddress("complement", value)} required={false} />
              </div>
            </fieldset>
            )}

          </div>

          <aside className="h-fit space-y-4 border border-border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="text-2xl">Resumo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
              {totals.discount > 0 ? <div className="flex justify-between"><dt>Desconto</dt><dd>-{formatCurrency(totals.discount)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-muted-foreground">Frete</dt><dd>{selectedShipping ? formatCurrency(selectedShipping.price) : "—"}</dd></div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatCurrency(previewTotal)}</dd></div>
            </dl>
            <Button type="submit" size="lg" className="label-caps w-full" disabled={submitting || !selectedShipping}>
              {submitting ? "Preparando pagamento..." : "Continuar para pagamento"}
            </Button>
            <p className="text-xs text-muted-foreground">PIX, crédito ou débito na próxima etapa, sem sair da loja.</p>
          </aside>
        </form>
      </Section>
    </StoreLayout>
  );
}

function Field({ id, label, value, onChange, required = true, ...props }: { id: string; label: string; value: string; onChange: (value: string) => void; required?: boolean } & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "required">) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} {...props} /></div>;
}

function ChoiceGroup({ title, children, ...props }: React.ComponentProps<typeof RadioGroup> & { title: string }) {
  return <fieldset className="space-y-4"><legend className="mb-4 text-2xl">{title}</legend><RadioGroup {...props}>{children}</RadioGroup></fieldset>;
}

function Choice({ id, value, label, detail }: { id: string; value: string; label: string; detail: string }) {
  return <label htmlFor={id} className="flex cursor-pointer items-center gap-3 border border-border bg-card p-4"><RadioGroupItem id={id} value={value} /><span className="flex flex-1 justify-between gap-4 text-sm"><strong>{label}</strong><span className="text-muted-foreground">{detail}</span></span></label>;
}

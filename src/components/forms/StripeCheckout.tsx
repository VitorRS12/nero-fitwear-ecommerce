import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getStripeOrder, type StripeOrder } from "@/lib/checkout.functions";
import { formatCurrency } from "@/lib/format";
import { OrderSummary, type SummaryData } from "./OrderSummary";
import { storeAppearance } from "./stripe-appearance";

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function getStripePromise(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key, { locale: "pt-BR" }));
  return stripeCache.get(key)!;
}

export function StripeCheckout({ initialOrder, summary, onPaid, onBack }: {
  initialOrder: StripeOrder; summary?: SummaryData | null; onPaid: () => void; onBack: () => void;
}) {
  const fetchOrder = useServerFn(getStripeOrder);
  const [order, setOrder] = useState(initialOrder);
  const [appearance, setAppearance] = useState<ReturnType<typeof storeAppearance> | null>(null);
  useEffect(() => { setAppearance(storeAppearance()); }, []);

  useEffect(() => {
    if (order.paymentStatus !== "pending") return;
    let active = true;
    const tick = async () => {
      try {
        const next = await fetchOrder({ data: { orderId: order.id } });
        if (!active) return;
        setOrder((current) => ({ ...next, clientSecret: next.clientSecret ?? current.clientSecret }));
        if (next.paymentStatus === "approved") onPaid();
      } catch { /* tenta de novo no próximo ciclo */ }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 5000);
    return () => { active = false; window.clearInterval(id); };
  }, [fetchOrder, order.id, order.paymentStatus, onPaid]);

  const stripePromise = useMemo(() => getStripePromise(order.publishableKey), [order.publishableKey]);

  let body: React.ReactNode;
  if (order.paymentStatus === "approved") {
    body = <><p role="status" className="text-sm">Pagamento aprovado. Seu pedido foi confirmado.</p>
      <Button asChild className="label-caps"><Link to="/conta">Ver meus pedidos</Link></Button></>;
  } else if (order.paymentStatus === "cancelled" || order.paymentStatus === "refunded") {
    body = <><p role="status" className="text-sm text-muted-foreground">Este pagamento foi encerrado. Faça um novo pedido.</p>
      <Button variant="outline" className="label-caps" onClick={onBack}>Voltar</Button></>;
  } else if (!order.clientSecret || !appearance) {
    body = <p className="text-sm text-muted-foreground">Carregando pagamento...</p>;
  } else {
    body = (
      <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret, appearance }}>
        <PayForm orderId={order.id} rejected={order.paymentStatus === "rejected"} onBack={onBack}
          onConfirmed={() => setOrder((o) => ({ ...o }))} />
      </Elements>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="order-2 space-y-6 border border-border bg-card p-6 sm:p-8 lg:order-1">
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <p className="label-caps text-xs text-muted-foreground">Pedido</p>
            <p className="text-lg">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="label-caps text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Cartão de crédito ou débito — a função é escolhida pelo próprio cartão informado.</p>
        {body}
      </div>
      <div className="order-1 lg:order-2">
        {summary && summary.items.length ? <OrderSummary data={summary} total={order.total} /> : null}
      </div>
    </div>
  );
}


function PayForm({ orderId, rejected, onBack, onConfirmed }: { orderId: string; rejected: boolean; onBack: () => void; onConfirmed: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [working, setWorking] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setWorking(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/checkout?pedido=${orderId}` },
    });
    setWorking(false);
    if (error) {
      toast.error(error.message ?? "Não foi possível concluir o pagamento.");
      return;
    }
    if (paymentIntent?.status === "succeeded") toast.success("Pagamento aprovado.");
    else if (paymentIntent?.status === "processing" || paymentIntent?.status === "requires_action") toast.message("Aguardando confirmação do pagamento.");
    onConfirmed();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {rejected ? <p role="alert" className="text-sm">O último pagamento foi recusado. Tente outro cartão ou PIX.</p> : null}
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" className="label-caps" disabled={!stripe || working}>
          {working ? "Processando..." : "Pagar"}
        </Button>
        <Button type="button" variant="outline" className="label-caps" onClick={onBack} disabled={working}>Voltar aos dados</Button>
      </div>
      <p className="text-xs text-muted-foreground">Pagamento processado com segurança pelo Stripe. Os dados do cartão não passam pela loja.</p>
    </form>
  );
}

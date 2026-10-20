import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getStripeOrder, type StripeOrder } from "@/lib/checkout.functions";
import { formatCurrency } from "@/lib/format";

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function getStripePromise(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key, { locale: "pt-BR" }));
  return stripeCache.get(key)!;
}

export function StripeCheckout({ initialOrder, onPaid, onBack }: {
  initialOrder: StripeOrder; onPaid: () => void; onBack: () => void;
}) {
  const fetchOrder = useServerFn(getStripeOrder);
  const [order, setOrder] = useState(initialOrder);

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

  if (order.paymentStatus === "approved") {
    return <Panel order={order}><p role="status" className="text-sm">Pagamento aprovado. Seu pedido foi confirmado.</p>
      <Button asChild className="label-caps"><Link to="/conta">Ver meus pedidos</Link></Button></Panel>;
  }
  if (order.paymentStatus === "cancelled" || order.paymentStatus === "refunded") {
    return <Panel order={order}><p role="status" className="text-sm text-muted-foreground">Este pagamento foi encerrado. Faça um novo pedido.</p>
      <Button variant="outline" className="label-caps" onClick={onBack}>Voltar</Button></Panel>;
  }
  if (!order.clientSecret) {
    return <Panel order={order}><p className="text-sm text-muted-foreground">Carregando pagamento...</p></Panel>;
  }
  return (
    <Panel order={order}>
      <Elements stripe={stripePromise} options={{
        clientSecret: order.clientSecret,
        appearance: { theme: "night", variables: { borderRadius: "0px", fontFamily: "inherit" } },
      }}>
        <PayForm orderId={order.id} rejected={order.paymentStatus === "rejected"} onBack={onBack}
          onConfirmed={() => setOrder((o) => ({ ...o }))} />
      </Elements>
    </Panel>
  );
}

function Panel({ order, children }: { order: StripeOrder; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl space-y-5 border border-border bg-card p-6">
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{order.orderNumber}</span>
        <strong>{formatCurrency(order.total)}</strong></div>
      {children}
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

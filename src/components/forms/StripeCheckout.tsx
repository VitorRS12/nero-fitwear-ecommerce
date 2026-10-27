import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getStripeOrder, type StripeOrder } from "@/lib/checkout.functions";
import { formatCurrency } from "@/lib/format";
import { MercadoPagoCheckout } from "./MercadoPagoCheckout";
import type { MercadoPagoResult } from "@/lib/mercado-pago.functions";
import { OrderSummary, type SummaryData } from "./OrderSummary";
import { storeAppearance } from "./stripe-appearance";

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function getStripePromise(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key, { locale: "pt-BR" }));
  return stripeCache.get(key)!;
}

export function StripeCheckout({ initialOrder, summary, onPaid, onBack, email = "" }: {
  initialOrder: StripeOrder; summary?: SummaryData | null; onPaid: () => void; onBack: () => void; email?: string;
}) {
  const [provider, setProvider] = useState<"stripe" | "mercadopago">("mercadopago");
  const [mpResult, setMpResult] = useState<MercadoPagoResult | null>(null);
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
  } else if (provider === "mercadopago") {
    body = mpResult ? <MercadoPagoStatus result={mpResult} onRetry={() => setMpResult(null)} /> : (
      <MercadoPagoCheckout orderId={order.id} amount={order.total} email={email}
        onResult={(r) => { setMpResult(r); if (r.status === "approved") { toast.success("Pagamento aprovado."); setOrder((o) => ({ ...o, paymentStatus: "approved" })); onPaid(); } }} />
    );
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
        {order.paymentStatus === "pending" || order.paymentStatus === "rejected" ? (
          <div role="tablist" aria-label="Processador de pagamento" className="grid grid-cols-2 border border-border">
            {(["mercadopago", "stripe"] as const).map((id) => (
              <button key={id} type="button" role="tab" aria-selected={provider === id}
                onClick={() => { setProvider(id); setMpResult(null); }}
                className={`label-caps px-4 py-3 text-xs transition-colors ${provider === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {id === "mercadopago" ? "Mercado Pago" : "Stripe"}
              </button>
            ))}
          </div>
        ) : null}
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

function MercadoPagoStatus({ result, onRetry }: { result: MercadoPagoResult; onRetry: () => void }) {
  if (result.status === "approved") return <p role="status" className="text-sm">Pagamento aprovado. Seu pedido foi confirmado.</p>;
  if (result.pixQrCode) {
    return (
      <div className="space-y-4" aria-live="polite">
        <p className="text-sm">Escaneie o QR Code ou copie o código PIX. A confirmação aparece aqui automaticamente.</p>
        {result.pixQrCodeBase64 ? <img src={`data:image/png;base64,${result.pixQrCodeBase64}`} alt="QR Code PIX" className="h-56 w-56 border border-border bg-foreground p-2" /> : null}
        <div className="flex gap-2">
          <input readOnly value={result.pixQrCode} aria-label="Código PIX copia e cola" className="min-w-0 flex-1 border border-border bg-background px-3 py-2 font-mono text-xs" />
          <Button type="button" variant="outline" onClick={() => { void navigator.clipboard.writeText(result.pixQrCode ?? ""); toast.success("Código PIX copiado."); }}>Copiar</Button>
        </div>
      </div>
    );
  }
  const pending = result.status === "in_process" || result.status === "pending";
  return (
    <div role="alert" className="space-y-3 text-sm">
      <p>{pending ? "Pagamento em análise. Avisaremos quando for confirmado." : "Pagamento recusado. Confira os dados ou tente outro cartão."}</p>
      {!pending ? <Button variant="outline" className="label-caps" onClick={onRetry}>Tentar novamente</Button> : null}
    </div>
  );
}

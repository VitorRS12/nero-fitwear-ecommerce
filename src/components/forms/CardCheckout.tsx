import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardPaymentBrick } from "@/components/forms/CardPaymentBrick";
import { cancelPreparedCardOrder, getCardConfiguration, getCardOrder, submitCardOrder } from "@/lib/card-checkout.functions";
import { formatCurrency } from "@/lib/format";
import type { CardOrder } from "@/types/card-payment";

export function CardCheckout({ initialOrder, email, cpf, onPaid, onBack }: {
  initialOrder: CardOrder; email: string; cpf: string; onPaid: () => void; onBack: () => void;
}) {
  const configure = useServerFn(getCardConfiguration);
  const fetchOrder = useServerFn(getCardOrder);
  const pay = useServerFn(submitCardOrder);
  const cancel = useServerFn(cancelPreparedCardOrder);
  const [order, setOrder] = useState(initialOrder);
  const [started, setStarted] = useState(Boolean(initialOrder.statusDetail));
  const [working, setWorking] = useState(false);
  const attemptKey = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const confirmedRef = useRef(false);
  const storageKey = `nero.card.attempt.${initialOrder.id}`;
  useEffect(() => { attemptKey.current = window.sessionStorage.getItem(storageKey); }, [storageKey]);
  const paidRef = useRef(onPaid); paidRef.current = onPaid;
  const configuration = useQuery({ queryKey: ["mercado-pago-card-config"], queryFn: () => configure(), staleTime: Infinity });
  const status = useQuery({ queryKey: ["card-order", initialOrder.id], queryFn: () => fetchOrder({ data: { orderId: initialOrder.id } }),
    refetchInterval: order.paymentStatus === "pending" ? 5000 : false, retry: 1 });
  useEffect(() => {
    if (!status.data) return;
    setOrder(status.data);
    if (submittingRef.current) return;
    setStarted(Boolean(status.data.statusDetail));
    if (status.data.paymentStatus === "rejected") {
      attemptKey.current = null;
      window.sessionStorage.removeItem(storageKey);
    }
    if (status.data.paymentStatus === "approved" && !confirmedRef.current) {
      confirmedRef.current = true;
      paidRef.current();
      window.sessionStorage.removeItem(storageKey);
    }
  }, [status.data, storageKey]);
  const rejected = order.paymentStatus === "rejected";
  const terminal = ["approved", "cancelled", "refunded"].includes(order.paymentStatus);
  return <section className="mx-auto max-w-2xl space-y-5">
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4"><h2 className="text-2xl">{order.orderNumber}</h2><span className="text-lg font-semibold">{formatCurrency(order.total)}</span></div>
    {order.paymentStatus === "approved" ? <p role="status">Pagamento aprovado. Seu pedido foi confirmado.</p>
      : rejected ? <p role="alert">Cartão recusado. Confira os dados ou tente outro cartão.</p>
      : terminal ? <p role="status">Pagamento encerrado.</p>
      : started && !order.challenge ? <p role="status">Pagamento em processamento. Aguarde a confirmação antes de tentar novamente.</p> : null}
    {configuration.isPending ? <p role="status" className="text-muted-foreground">Carregando pagamento seguro...</p> : null}
    {configuration.isError ? <div role="alert"><p>Pagamento com cartão indisponível.</p><Button variant="outline" onClick={() => void configuration.refetch()}>Tentar novamente</Button></div> : null}
    {configuration.data && status.data && order.total > 0 && !terminal && (!started || order.challenge || rejected) ? <CardPaymentBrick
      key={rejected ? "retry" : "initial"} publicKey={configuration.data.publicKey} amount={order.total} email={email} cpf={cpf}
      challenge={order.challenge} paymentId={order.paymentId}
      onSubmit={async (card) => {
        if (submittingRef.current) throw new Error("Pagamento em processamento.");
        submittingRef.current = true;
        setWorking(true);
        const key = attemptKey.current ?? crypto.randomUUID();
        attemptKey.current = key;
        window.sessionStorage.setItem(storageKey, key);
        try {
          const result = await pay({ data: { orderId: order.id, attemptKey: key, card } });
          setOrder(result);
          setStarted(true);
          if (result.paymentStatus === "rejected") { attemptKey.current = null; window.sessionStorage.removeItem(storageKey); }
          if (result.paymentStatus === "approved" && !confirmedRef.current) { confirmedRef.current = true; paidRef.current(); window.sessionStorage.removeItem(storageKey); toast.success("Pagamento aprovado."); }
          void status.refetch();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível processar o pagamento.");
          // Preserve the same key after an uncertain outcome; never create a second charge.
          void status.refetch();
        } finally { submittingRef.current = false; setWorking(false); }
      }} /> : null}
    {status.isError ? <div role="alert"><p className="text-sm text-muted-foreground">Não foi possível atualizar o pagamento.</p><Button variant="outline" onClick={() => void status.refetch()}>Consultar novamente</Button></div> : null}
    {!started && !terminal ? <Button variant="outline" disabled={working} onClick={async () => {
      setWorking(true);
      try { await cancel({ data: { orderId: order.id } }); onBack(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível voltar."); }
      finally { setWorking(false); }
    }}>Voltar aos dados</Button> : null}
    {terminal ? <Button variant="outline" onClick={onBack}>Voltar à compra</Button> : null}
  </section>;
}
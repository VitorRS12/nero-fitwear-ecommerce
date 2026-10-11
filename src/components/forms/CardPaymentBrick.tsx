import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMercadoPagoBrowser } from "@/services/mercado-pago-browser.service";
import type { BrickController, CardFormData, CardOrder } from "@/types/card-payment";

interface Props {
  publicKey: string;
  amount: number;
  email: string;
  cpf: string;
  challenge?: CardOrder["challenge"];
  paymentId?: string | null;
  onSubmit?: (card: CardFormData) => Promise<void>;
}

export function CardPaymentBrick({ publicKey, amount, email, cpf, challenge, paymentId, onSubmit }: Props) {
  const id = `nero-card-${useId().replace(/:/g, "")}`;
  const resourceURL = challenge?.externalResourceURL;
  const creq = challenge?.creq;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  useEffect(() => {
    let disposed = false;
    let controller: BrickController | undefined;
    setReady(false); setError(null);
    void createMercadoPagoBrowser(publicKey).then(async (mp) => {
      if (disposed) return;
      const settings = {
        initialization: resourceURL && creq && paymentId
          ? { paymentId, additionalInfo: { externalResourceURL: resourceURL, creq } }
          : { amount, payer: { ...(email ? { email } : {}), ...(cpf ? { identification: { type: "CPF", number: cpf } } : {}) } },
        customization: {
          visual: { style: { theme: "dark" } },
          ...(!resourceURL ? { paymentMethods: { types: { included: ["credit_card", "debit_card"] } } } : {}),
        },
        callbacks: {
          onReady: () => { if (!disposed) setReady(true); },
          onError: () => { if (!disposed) setError("Não foi possível carregar o pagamento com cartão."); },
          onSubmit: (card: CardFormData) => submitRef.current?.(card) ?? Promise.resolve(),
        },
      };
      controller = await mp.bricks().create(resourceURL ? "statusScreen" : "cardPayment", id, settings);
      if (disposed) void controller.unmount();
    }).catch(() => { if (!disposed) setError("Não foi possível carregar o pagamento com cartão."); });
    return () => { disposed = true; void controller?.unmount(); };
  }, [publicKey, amount, email, cpf, resourceURL, creq, paymentId, id, retry]);
  return (
    <div className="min-h-80" aria-busy={!ready && !error}>
      {!ready && !error ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Carregando pagamento seguro...</p> : null}
      {error ? <div role="alert" className="space-y-3"><p className="text-sm">{error}</p><Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}><RotateCcw />Tentar novamente</Button></div> : null}
      <div id={id} />
    </div>
  );
}
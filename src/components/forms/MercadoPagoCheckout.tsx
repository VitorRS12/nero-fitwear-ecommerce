import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getMercadoPagoPublicKey, payWithMercadoPago, type MercadoPagoResult } from "@/lib/mercado-pago.functions";

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

interface BrickController { unmount: () => void }
interface MercadoPagoSdk {
  bricks: () => { create: (type: string, id: string, settings: unknown) => Promise<BrickController> };
}
declare global { interface Window { MercadoPago?: new (key: string, opts: { locale: string }) => MercadoPagoSdk } }

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("sdk")));
    if (!existing) { script.src = SDK_URL; script.async = true; document.head.appendChild(script); }
  });
}

/** Formulário seguro do Mercado Pago (cartão de crédito, débito e PIX) dentro da loja. */
export function MercadoPagoCheckout({ orderId, amount, email, onResult }: {
  orderId: string; amount: number; email: string; onResult: (r: MercadoPagoResult) => void;
}) {
  const getKey = useServerFn(getMercadoPagoPublicKey);
  const pay = useServerFn(payWithMercadoPago);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const containerId = `mp-brick-${orderId.slice(0, 8)}`;
  const resultRef = useRef(onResult);
  resultRef.current = onResult;

  useEffect(() => {
    let controller: BrickController | null = null;
    let active = true;
    setState("loading");
    (async () => {
      try {
        const [{ publicKey }] = await Promise.all([getKey(), loadSdk()]);
        if (!active || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        controller = await mp.bricks().create("payment", containerId, {
          initialization: { amount, payer: { email } },
          customization: {
            visual: { style: { theme: "dark" } },
            paymentMethods: { creditCard: "all", debitCard: "all", bankTransfer: "all", maxInstallments: 12 },
          },
          callbacks: {
            onReady: () => active && setState("ready"),
            onError: (e: unknown) => console.error("[mercado-pago] brick", e),
            onSubmit: async ({ formData }: { formData: Record<string, unknown> }) => {
              try {
                const result = await pay({ data: { orderId, formData: formData as never } });
                resultRef.current(result);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Não foi possível concluir o pagamento.");
                throw err;
              }
            },
          },
        });
        if (!active) controller.unmount();
      } catch {
        if (active) setState("error");
      }
    })();
    return () => { active = false; controller?.unmount(); };
  }, [amount, attempt, containerId, email, getKey, orderId, pay]);

  return (
    <div className="space-y-3">
      {state === "loading" ? <p className="text-sm text-muted-foreground" role="status">Carregando formulário do Mercado Pago...</p> : null}
      {state === "error" ? (
        <div role="alert" className="space-y-3 text-sm">
          <p>Não foi possível carregar o Mercado Pago.</p>
          <Button variant="outline" className="label-caps" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>
        </div>
      ) : null}
      <div id={containerId} />
      <p className="text-xs text-muted-foreground">Processado pelo Mercado Pago. Os dados do cartão não passam pela loja.</p>
    </div>
  );
}

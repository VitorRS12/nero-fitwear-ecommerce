import type { MercadoPagoBrowser } from "@/types/card-payment";

type MercadoPagoWindow = Window & { MercadoPago?: new (key: string, options: { locale: string }) => MercadoPagoBrowser };
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if ((window as MercadoPagoWindow).MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    const timeout = window.setTimeout(() => { script.remove(); sdkPromise = null; reject(new Error("O formulário de cartão demorou para carregar.")); }, 20000);
    script.onload = () => { window.clearTimeout(timeout); resolve(); };
    script.onerror = () => { window.clearTimeout(timeout); script.remove(); sdkPromise = null; reject(new Error("Não foi possível carregar o formulário de cartão.")); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export async function createMercadoPagoBrowser(publicKey: string): Promise<MercadoPagoBrowser> {
  await loadSdk();
  const Constructor = (window as MercadoPagoWindow).MercadoPago;
  if (!Constructor) throw new Error("Formulário de cartão indisponível.");
  return new Constructor(publicKey, { locale: "pt-BR" });
}
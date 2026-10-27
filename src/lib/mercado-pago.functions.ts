import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MercadoPagoResult {
  paymentId: string;
  status: string;
  statusDetail: string;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixTicketUrl: string | null;
}

/** Chave pública do Mercado Pago (não é segredo; usada pelo formulário seguro). */
export const getMercadoPagoPublicKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = process.env["MERCADO_PAGO_PUBLIC_KEY"];
    if (!key) throw new Error("Mercado Pago ainda não foi configurado na loja.");
    return { publicKey: key };
  });

const formSchema = z.object({
  orderId: z.string().uuid(),
  formData: z.object({
    token: z.string().min(8).max(200).optional(),
    payment_method_id: z.string().min(2).max(40),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    installments: z.number().int().min(1).max(12).optional(),
    payer: z.object({
      email: z.string().email().max(200),
      identification: z.object({ type: z.string().max(10), number: z.string().max(20) }).optional(),
    }),
  }),
});

/** Cria o pagamento no Mercado Pago com o valor lido do banco e concilia o pedido. */
export const payWithMercadoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => formSchema.parse(input))
  .handler(async ({ data, context }): Promise<MercadoPagoResult> => {
    const { data: order, error } = await context.supabase
      .from("orders").select("id, order_number, total, payment_status")
      .eq("id", data.orderId).eq("user_id", context.userId).single();
    if (error || !order) throw new Error("Pedido não encontrado.");
    if (order.payment_status !== "pending" && order.payment_status !== "rejected")
      throw new Error("Este pedido já foi encerrado. Inicie uma nova compra.");

    const { createMercadoPagoPayment, applyMercadoPagoPayment } = await import("@/lib/mercado-pago.server");
    const isPix = data.formData.payment_method_id === "pix";
    if (!isPix && !data.formData.token) throw new Error("Dados do cartão incompletos.");

    let origin = "";
    try { origin = new URL(getRequest().url).origin; } catch { /* sem origem */ }
    const notificationUrl = origin.startsWith("https://") ? `${origin}/api/public/mercado-pago/webhook` : undefined;

    const payment = await createMercadoPagoPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      form: data.formData as never,
      notificationUrl,
    });

    try { await applyMercadoPagoPayment(payment); }
    catch (e) { console.error("[mercado-pago] immediate reconciliation failed", e instanceof Error ? e.message : e); }

    const tx = payment.point_of_interaction?.transaction_data;
    return {
      paymentId: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail ?? "",
      pixQrCode: tx?.qr_code ?? null,
      pixQrCodeBase64: tx?.qr_code_base64 ?? null,
      pixTicketUrl: tx?.ticket_url ?? null,
    };
  });

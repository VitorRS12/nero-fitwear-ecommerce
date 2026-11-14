import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyMercadoPagoPayment, type MercadoPagoPayment } from "./mercado-pago.server";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));

const payment: MercadoPagoPayment = {
  id: 123,
  status: "approved",
  transaction_amount: 100,
  currency_id: "BRL",
  payment_type_id: "credit_card",
  external_reference: "11111111-1111-4111-8111-111111111111",
};

describe("resultado da conciliação Mercado Pago", () => {
  beforeEach(() => { rpc.mockReset(); });

  it("não confirma quando a RPC recusa o valor", async () => {
    rpc.mockResolvedValue({ data: { ok: false, reason: "amount_mismatch" }, error: null });
    await expect(applyMercadoPagoPayment(payment)).rejects.toThrow("Falha ao conciliar pagamento.");
  });

  it("não confirma uma resposta vazia", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(applyMercadoPagoPayment(payment)).rejects.toThrow("Falha ao conciliar pagamento.");
  });

  it("retorna aprovação somente com confirmação explícita da RPC", async () => {
    rpc.mockResolvedValue({ data: { ok: true, status: "approved" }, error: null });
    await expect(applyMercadoPagoPayment(payment)).resolves.toEqual({ ok: true, result: { ok: true, status: "approved" } });
    expect(rpc).toHaveBeenCalledWith("apply_mercado_pago_payment", expect.objectContaining({
      _order_id: payment.external_reference, _provider_payment_id: "123", _amount: 100, _currency: "BRL",
    }));
  });
});
import { afterEach, describe, expect, it, vi } from "vitest";
import { releaseExpiredStripeOrders } from "./stripe.server";

const { from, release, retrieve, cancel } = vi.hoisted(() => ({
  from: vi.fn(), release: vi.fn(), retrieve: vi.fn(), cancel: vi.fn(),
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from, rpc: release } }));
vi.mock("stripe", () => {
  class Stripe {
    static createFetchHttpClient() { return {}; }
    paymentIntents = { retrieve, cancel };
  }
  return { default: Stripe };
});

function setup(payments: unknown) {
  vi.stubEnv("STRIPE_SECRET_KEY", "fixture-only");
  const orders = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [{ id: "order-1" }] }),
  };
  const paymentQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: payments }) };
  from.mockImplementation((table: string) => table === "orders" ? orders : paymentQuery);
}

describe("isolamento da expiração Stripe", () => {
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });

  it("não libera nem cancela pedido com pagamento Mercado Pago", async () => {
    setup([{ provider: "mercadopago", provider_payment_id: "123" }]);
    expect(await releaseExpiredStripeOrders()).toBe(0);
    expect(release).not.toHaveBeenCalled();
    expect(retrieve).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("não libera pedido quando a consulta dos pagamentos falha", async () => {
    setup(null);
    expect(await releaseExpiredStripeOrders()).toBe(0);
    expect(release).not.toHaveBeenCalled();
  });

  it("mantém liberação de pedido expirado sem pagamentos registrados", async () => {
    setup([]);
    release.mockResolvedValue({ data: true });
    expect(await releaseExpiredStripeOrders()).toBe(1);
    expect(release).toHaveBeenCalledWith("release_order_reservation", { _order_id: "order-1" });
  });
});
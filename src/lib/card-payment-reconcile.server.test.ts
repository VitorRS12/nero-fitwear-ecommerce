import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ single: vi.fn(), rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ single: mocks.single }) }) }) }),
    rpc: mocks.rpc,
  },
}));
import { reconcileCardPayment } from "./card-payment-reconcile.server";

const orderId = "a7ce16e0-b512-4eff-a364-0fb1c62df790";
const payment = { id: 123, status: "approved", external_reference: orderId, transaction_amount: 129.9,
  payment_type_id: "credit_card", metadata: { attempt_key: "current-attempt" } };

beforeEach(() => { vi.clearAllMocks(); mocks.single.mockResolvedValue({ data: { idempotency_key: "current-attempt" }, error: null }); mocks.rpc.mockResolvedValue({ error: null }); });
describe("atomic card reconciliation", () => {
  it("rejects another order or payment type before privileged writes", async () => {
    await expect(reconcileCardPayment(orderId, { ...payment, external_reference: "other-order" })).rejects.toThrow();
    await expect(reconcileCardPayment(orderId, { ...payment, payment_type_id: "pix" })).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("ignores delayed notifications from older attempts", async () => {
    expect(await reconcileCardPayment(orderId, { ...payment, metadata: { attempt_key: "older-attempt" } })).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("records and applies status in a single locked database operation", async () => {
    expect(await reconcileCardPayment(orderId, payment)).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("record_card_payment", expect.objectContaining({ _order_id: orderId, _payment_id: "123", _amount: 129.9 }));
  });
  it("never reports success after database rejection", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "amount mismatch" } });
    await expect(reconcileCardPayment(orderId, payment)).rejects.toThrow("registrar");
  });
});
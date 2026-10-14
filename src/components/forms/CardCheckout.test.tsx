import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { CardOrder } from "@/types/card-payment";

const mocks = vi.hoisted(() => ({ options: vi.fn(), server: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.server }));
vi.mock("@tanstack/react-query", () => ({ useQuery: (options: unknown) => {
  mocks.options(options);
  return { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
} }));
vi.mock("@/lib/card-checkout.functions", () => ({
  cancelPreparedCardOrder: vi.fn(), getCardConfiguration: vi.fn(), getCardOrder: vi.fn(), submitCardOrder: vi.fn(),
}));
vi.mock("@/components/forms/CardPaymentBrick", () => ({ CardPaymentBrick: () => null }));
import { CardCheckout } from "./CardCheckout";

const order: CardOrder = {
  id: "a7ce16e0-b512-4eff-a364-0fb1c62df790", orderNumber: "NERO-1001", total: 129.9,
  paymentStatus: "pending", paymentId: null, statusDetail: null, challenge: null,
};
function render(changes: Partial<CardOrder> = {}) {
  return renderToStaticMarkup(<CardCheckout initialOrder={{ ...order, ...changes }} email="test@testuser.com"
    cpf="12345678909" onPaid={vi.fn()} onBack={vi.fn()} />);
}
beforeEach(() => vi.clearAllMocks());

describe("card checkout render contract (not browser effects or provider E2E)", () => {
  it("does not confirm an unsubmitted pending order", () => {
    const html = render();
    expect(html).not.toContain("Pagamento aprovado");
    expect(html).toContain("Voltar aos dados");
  });
  it("shows processing instead of approval for a resumed attempt", () => {
    const html = render({ statusDetail: "processing", paymentId: "123" });
    expect(html).toContain("Pagamento em processamento");
    expect(html).not.toContain("Voltar aos dados");
    expect(html).not.toContain("Pagamento aprovado");
  });
  it("shows approval only for the approved local status", () => {
    const html = render({ paymentStatus: "approved" });
    expect(html).toContain("Pagamento aprovado. Seu pedido foi confirmado.");
    expect(html).not.toContain("Voltar aos dados");
  });
  it("shows refusal without reporting approval", () => {
    const html = render({ paymentStatus: "rejected", statusDetail: "cc_rejected_other_reason" });
    expect(html).toContain("Cartão recusado");
    expect(html).not.toContain("Pagamento aprovado");
  });
  it.each(["cancelled", "refunded"] as const)("shows a terminal %s order as closed", (paymentStatus) => {
    const html = render({ paymentStatus });
    expect(html).toContain("Pagamento encerrado");
    expect(html).toContain("Voltar à compra");
  });
  it("scopes status queries to the order and polls pending orders every five seconds", () => {
    render();
    expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ["card-order", order.id], refetchInterval: 5000, retry: 1,
    }));
  });
  it.each(["approved", "rejected", "cancelled", "refunded"] as const)("disables interval polling for %s", (paymentStatus) => {
    render({ paymentStatus });
    expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ["card-order", order.id], refetchInterval: false,
    }));
  });
});
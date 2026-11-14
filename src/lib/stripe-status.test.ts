import { describe, expect, it } from "vitest";
import { amountMatches, mapStripeStatus, paymentMethodFromTypes, toCents } from "./stripe-status";

describe("stripe status rules", () => {
  it("marca o pedido como pago somente quando o Stripe confirma", () => {
    expect(mapStripeStatus("succeeded")).toBe("approved");
    expect(mapStripeStatus("processing")).toBe("pending");
    expect(mapStripeStatus("requires_action")).toBe("pending");
  });
  it("cartão recusado permite nova tentativa e cancelamento encerra", () => {
    expect(mapStripeStatus("requires_payment_method")).toBe("rejected");
    expect(mapStripeStatus("canceled")).toBe("cancelled");
  });
  it("converte reais para centavos sem erro de arredondamento", () => {
    expect(toCents(199.9)).toBe(19990);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
  it("recusa valor diferente do pedido", () => {
    expect(amountMatches(219.8, 21980)).toBe(true);
    expect(amountMatches(219.8, 21979)).toBe(false);
  });
  it("identifica PIX e cartão", () => {
    expect(paymentMethodFromTypes("pix")).toBe("pix");
    expect(paymentMethodFromTypes("card")).toBe("card");
    expect(paymentMethodFromTypes("boleto")).toBeNull();
  });
});

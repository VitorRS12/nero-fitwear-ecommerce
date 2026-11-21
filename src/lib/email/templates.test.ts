import { describe, expect, it } from "vitest";
import { escapeHtml, paymentConfirmedEmail, pickupReadyEmail, PICKUP_ADDRESS, trackingEmail } from "./templates";

const order = { orderNumber: "NERO-1", customerName: "Ana Souza", items: [{ name: "Short", quantity: 2, total: 100 }], subtotal: 100, shippingCost: 0, discount: 0, total: 100, isPickup: true };

describe("e-mails", () => {
  it("escapa HTML vindo do cliente", () => {
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
    expect(paymentConfirmedEmail({ ...order, customerName: "<script>" }).html).not.toContain("<script>");
  });
  it("retirada mostra o endereço da loja", () => {
    expect(pickupReadyEmail({ orderNumber: "NERO-1", customerName: "Ana" }).html).toContain("10A Rua Roberto Rebouças, 197");
    expect(PICKUP_ADDRESS).toContain("42850-000");
  });
  it("rastreio leva o código dos Correios", () => {
    expect(trackingEmail({ orderNumber: "NERO-1", customerName: "Ana", trackingCode: "AB123456789BR" }).html).toContain("objeto=AB123456789BR");
  });
  it("confirmação de pagamento traz o total", () => {
    expect(paymentConfirmedEmail(order).text).toContain("100,00");
  });
});

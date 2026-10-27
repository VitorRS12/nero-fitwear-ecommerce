import { describe, expect, it } from "vitest";
import { buildPaymentBody } from "./mercado-pago.server";

const base = { orderId: "11111111-1111-1111-1111-111111111111", orderNumber: "NERO-1", amount: 199.9 };
describe("buildPaymentBody", () => {
  it("usa o valor do pedido e referência do pedido no cartão", () => {
    const b = buildPaymentBody({ ...base, form: { token: "tok_123456", payment_method_id: "master", installments: 3, issuer_id: "24", payer: { email: "a@b.com" } } });
    expect(b["transaction_amount"]).toBe(199.9);
    expect(b["external_reference"]).toBe(base.orderId);
    expect(b["installments"]).toBe(3);
    expect(b["issuer_id"]).toBe(24);
  });
  it("PIX não envia token e expira em ISO com offset", () => {
    const b = buildPaymentBody({ ...base, form: { payment_method_id: "pix", payer: { email: "a@b.com" } } });
    expect(b["token"]).toBeUndefined();
    expect(String(b["date_of_expiration"])).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+00:00$/);
  });
});

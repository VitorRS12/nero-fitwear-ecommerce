import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCardPayload, cardResult, createCardPayment } from "./card-payment.server";
import { cardSubmissionSchema } from "./card-payment.schema";
import { paymentSnapshot } from "./mercado-pago.server";

const orderId = "a7ce16e0-b512-4eff-a364-0fb1c62df790";
const attemptKey = "2c1a2a8d-0b91-4003-93b2-478535807e32";
const input = { orderId, orderNumber: "NERO-1001", amount: 129.9, attemptKey,
  card: { token: "isolated-test-token", payment_method_id: "visa", installments: 3,
    payer: { email: "test@example.com", identification: { type: "CPF", number: "12345678909" } } } };

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("card payment boundary", () => {
  it("keeps order, amount, attempt and card token separate without PIX expiration", () => {
    const payload = buildCardPayload(input);
    expect(payload.external_reference).toBe(orderId);
    expect(payload.metadata.attempt_key).toBe(attemptKey);
    expect(payload.transaction_amount).toBe(129.9);
    expect(payload.installments).toBe(3);
    expect(payload).not.toHaveProperty("date_of_expiration");
    expect(payload).not.toHaveProperty("card_number");
    expect(payload.three_d_secure_mode).toBe("optional");
  });

  it("rejects invalid submissions and strips client amounts and raw card fields", () => {
    const parsed = cardSubmissionSchema.parse({ orderId, attemptKey, card: { ...input.card, transaction_amount: 0.01, card_number: "untrusted" } });
    expect(parsed.card).not.toHaveProperty("transaction_amount");
    expect(parsed.card).not.toHaveProperty("card_number");
    expect(() => cardSubmissionSchema.parse({ orderId, attemptKey, card: { ...input.card, installments: 0 } })).toThrow();
    expect(() => cardSubmissionSchema.parse({ orderId, attemptKey, card: { ...input.card, token: "" } })).toThrow();
  });

  it("sends credit installments and stable idempotency header through HTTP", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "isolated-test-credential");
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "visa", payment_type_id: "credit_card" }])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 123, status: "approved", transaction_amount: 129.9 })));
    vi.stubGlobal("fetch", request);
    await createCardPayment(input);
    const call = request.mock.calls[1];
    expect(call?.[0]).toBe("https://api.mercadopago.com/v1/payments");
    expect(new Headers(call?.[1]?.headers).get("X-Idempotency-Key")).toBe(attemptKey);
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ transaction_amount: 129.9, installments: 3, external_reference: orderId });
  });

  it("rejects debit installments before charging", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "isolated-test-credential");
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([{ id: "visa", payment_type_id: "debit_card" }])));
    vi.stubGlobal("fetch", request);
    await expect(createCardPayment(input)).rejects.toThrow("à vista");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("does not expose card tokens, payer or challenge secrets in persisted snapshot", () => {
    const snapshot = paymentSnapshot({ id: 123, status: "pending", transaction_amount: 129.9, payment_type_id: "credit_card", three_ds_info: { creq: "challenge-secret" } });
    expect(snapshot).not.toHaveProperty("token");
    expect(snapshot).not.toHaveProperty("payer");
    expect(snapshot).not.toHaveProperty("three_ds_info");
  });

  it("returns HTTPS challenges only for pending_challenge", () => {
    const order = { id: orderId, order_number: "NERO-1001", total: 129.9, payment_status: "pending" as const };
    const payment = { id: 123, status: "pending", status_detail: "pending_challenge", transaction_amount: 129.9, three_ds_info: { external_resource_url: "https://issuer.example/challenge", creq: "test" } };
    expect(cardResult(order, payment).challenge).toEqual({ externalResourceURL: "https://issuer.example/challenge", creq: "test" });
    expect(cardResult(order, { ...payment, status_detail: "accredited" }).challenge).toBeNull();
    expect(cardResult(order, { ...payment, three_ds_info: { external_resource_url: "javascript:alert(1)", creq: "test" } }).challenge).toBeNull();
  });

  it("logs only HTTP status on provider errors, never returned personal information", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "isolated-test-credential");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: "visa", payment_type_id: "credit_card" }])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "sensitive", payer: "sensitive" }), { status: 400 }));
    vi.stubGlobal("fetch", request);
    await expect(createCardPayment(input)).rejects.toThrow("processar o pagamento");
    expect(log).toHaveBeenCalledWith("[mercado-pago] request failed [400]");
    expect(JSON.stringify(log.mock.calls)).not.toContain("sensitive");
  });
});
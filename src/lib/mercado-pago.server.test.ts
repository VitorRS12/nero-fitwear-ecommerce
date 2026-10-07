import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCreatePixPayload, createPixPayment, normalizeMercadoPagoExpiration } from "./mercado-pago.server";

const ORDER_ID = "a7ce16e0-b512-4eff-a364-0fb1c62df790";
const NOW = Date.parse("2026-10-05T18:00:00Z");

describe("normalizeMercadoPagoExpiration", () => {
  it("normalizes a PostgreSQL timestamp to UTC with milliseconds and explicit offset", () => {
    expect(normalizeMercadoPagoExpiration("2026-10-05T16:39:30.123-03:00", NOW)).toBe(
      "2026-10-05T19:39:30.123+00:00",
    );
  });

  it("converts Z into an explicit UTC offset without changing the instant", () => {
    const source = "2026-10-05T19:39:30Z";
    const normalized = normalizeMercadoPagoExpiration(source, NOW);
    expect(normalized).toBe("2026-10-05T19:39:30.000+00:00");
    expect(Date.parse(normalized)).toBe(Date.parse(source));
  });

  it("rejects missing timezone and non-string input", () => {
    expect(() => normalizeMercadoPagoExpiration("2026-10-05T19:39:30", NOW)).toThrow("data inválida");
    expect(() => normalizeMercadoPagoExpiration(null, NOW)).toThrow("não foi informada");
  });

  it("rejects a Brazilian date format", () => {
    expect(() => normalizeMercadoPagoExpiration("05-10-2026T19:39:30UTC", NOW)).toThrow(
      "data inválida",
    );
  });

  it("rejects a date contaminated by an UUID", () => {
    expect(() => normalizeMercadoPagoExpiration(`2026-10-05T19:39:30Z;${ORDER_ID}`, NOW)).toThrow(
      "data inválida",
    );
  });

  it("rejects expired timestamps", () => {
    expect(() => normalizeMercadoPagoExpiration("2026-10-05T17:59:59Z", NOW)).toThrow(
      "data futura",
    );
  });
});

describe("buildCreatePixPayload", () => {
  it("keeps expiration and order UUID in separate fields", () => {
    const payload = buildCreatePixPayload(
      {
        orderId: ORDER_ID,
        orderNumber: "NERO-1001",
        amount: 129.9,
        email: "comprador@example.com",
        firstName: "Cliente",
        lastName: "Teste",
        cpf: "12345678909",
        expiresAt: "2026-10-05T16:39:30.000-03:00",
        idempotencyKey: ORDER_ID,
      },
      NOW,
    );

    expect(payload.date_of_expiration).toBe("2026-10-05T19:39:30.000+00:00");
    expect(payload.date_of_expiration).not.toContain(ORDER_ID);
    expect(payload.external_reference).toBe(ORDER_ID);
    expect(payload.metadata.order_id).toBe(ORDER_ID);
  });
});

describe("createPixPayment HTTP boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("sends the normalized date in JSON and preserves the idempotency key separately", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "test-placeholder");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 123, status: "pending", transaction_amount: 129.9 })),
    );
    vi.stubGlobal("fetch", request);

    await createPixPayment({
      orderId: ORDER_ID,
      orderNumber: "NERO-1001",
      amount: 129.9,
      email: "comprador@example.com",
      firstName: "Cliente",
      lastName: "Teste",
      cpf: "12345678909",
      expiresAt: "2026-10-05T16:39:30.123-03:00",
      idempotencyKey: ORDER_ID,
    });

    const call = request.mock.calls[0];
    expect(call?.[0]).toBe("https://api.mercadopago.com/v1/payments");
    const init = call?.[1];
    expect(typeof init?.body).toBe("string");
    const body = JSON.parse(String(init?.body));
    expect(body.date_of_expiration).toBe("2026-10-05T19:39:30.123+00:00");
    expect(body.date_of_expiration).not.toContain(";");
    expect(body.external_reference).toBe(ORDER_ID);
    expect(body.metadata.order_id).toBe(ORDER_ID);
    expect(new Headers(init?.headers).get("X-Idempotency-Key")).toBe(ORDER_ID);
    expect(log).toHaveBeenCalledWith("[mercado-pago] date_of_expiration: 2026-10-05T19:39:30.123+00:00");
    expect(log).toHaveBeenCalledTimes(1);
  });
});
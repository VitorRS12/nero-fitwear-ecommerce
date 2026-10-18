import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCreatePixPayload, createPixPayment, normalizeMercadoPagoExpiration, verifyMercadoPagoSignature } from "./mercado-pago.server";
import type { MercadoPagoError as MercadoPagoErrorType } from "./mercado-pago.server";

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

describe("webhook signature security", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  async function signedNotification(timestamp: number, dataId = "123") {
    const secret = "isolated-test-secret";
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", secret);
    const ts = String(timestamp);
    const requestId = "test-request";
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`id:${dataId};request-id:${requestId};ts:${ts};`));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return { signature: `ts=${ts},v1=${hash}`, requestId, dataId };
  }

  it("accepts a genuine signature, including a repeated delivery", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const notification = await signedNotification(NOW / 1000);
    expect(await verifyMercadoPagoSignature(notification)).toBe(true);
    expect(await verifyMercadoPagoSignature(notification)).toBe(true);
  });

  it("rejects a changed payment identifier or request identifier", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const notification = await signedNotification(NOW / 1000);
    expect(await verifyMercadoPagoSignature({ ...notification, dataId: "456" })).toBe(false);
    expect(await verifyMercadoPagoSignature({ ...notification, requestId: "tampered" })).toBe(false);
  });

  it("rejects old and malformed signatures", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(await verifyMercadoPagoSignature(await signedNotification(NOW / 1000 - 301))).toBe(false);
    expect(await verifyMercadoPagoSignature({ signature: "invalid", requestId: "test", dataId: "123" })).toBe(false);
  });
});
describe("MercadoPagoError", () => {
  it("marks 4xx responses as not created and logs only safe provider details", async () => {
    const { mercadoPagoRequest, MercadoPagoError } = await import("@/lib/mercado-pago.server");
    process.env["MERCADO_PAGO_ACCESS_TOKEN"] = "TEST-token";
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "invalid date_of_expiration", cause: [{ code: 23, data: "secret" }] }), { status: 400 })));
    const error = await mercadoPagoRequest("/v1/payments").catch((e: unknown) => e) as InstanceType<typeof MercadoPagoErrorType>;
    expect(error).toBeInstanceOf(MercadoPagoError);
    expect(error.definitelyNotCreated).toBe(true);
    expect(log).toHaveBeenCalledWith("[mercado-pago] provider message: invalid date_of_expiration (codes: 23)");
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
    vi.unstubAllGlobals();
  });
  it("treats 5xx as uncertain", async () => {
    const { mercadoPagoRequest } = await import("@/lib/mercado-pago.server");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 502 })));
    const error = await mercadoPagoRequest("/v1/payments").catch((e: unknown) => e) as InstanceType<typeof MercadoPagoErrorType>;
    expect(error.definitelyNotCreated).toBe(false);
    vi.unstubAllGlobals();
  });
});

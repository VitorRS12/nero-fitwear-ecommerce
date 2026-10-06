import { describe, expect, it } from "vitest";

import { buildCreatePixPayload, normalizeMercadoPagoExpiration } from "./mercado-pago.server";

const ORDER_ID = "a7ce16e0-b512-4eff-a364-0fb1c62df790";
const NOW = Date.parse("2026-10-05T18:00:00Z");

describe("normalizeMercadoPagoExpiration", () => {
  it("normalizes a PostgreSQL timestamp to UTC without milliseconds", () => {
    expect(normalizeMercadoPagoExpiration("2026-10-05T16:39:30.123-03:00", NOW)).toBe(
      "2026-10-05T19:39:30Z",
    );
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

    expect(payload.date_of_expiration).toBe("2026-10-05T19:39:30Z");
    expect(payload.date_of_expiration).not.toContain(ORDER_ID);
    expect(payload.external_reference).toBe(ORDER_ID);
    expect(payload.metadata.order_id).toBe(ORDER_ID);
  });
});
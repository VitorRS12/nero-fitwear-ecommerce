import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { buildManifest, parseSignatureHeader, verifyMercadoPagoSignature } from "./mercado-pago-signature";

const secret = "segredo-teste";
const ts = "1761268800";
const nowMs = 1761268800 * 1000;
const sign = (m: string) => createHmac("sha256", secret).update(m).digest("hex");

describe("assinatura Mercado Pago", () => {
  it("monta o manifesto oficial com id em minúsculas", () => {
    expect(buildManifest("ABC123", "req-1", ts)).toBe(`id:abc123;request-id:req-1;ts:${ts};`);
  });

  it("lê ts e v1 do cabeçalho", () => {
    expect(parseSignatureHeader("ts=1,v1=abc")).toEqual({ ts: "1", v1: "abc" });
    expect(parseSignatureHeader("v1=abc")).toBeNull();
  });

  it("aceita assinatura válida", async () => {
    const v1 = sign(`id:123;request-id:req-1;ts:${ts};`);
    expect(await verifyMercadoPagoSignature({ secret, signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123", nowMs })).toBe(true);
  });

  it("recusa assinatura de outro pagamento", async () => {
    const v1 = sign(`id:123;request-id:req-1;ts:${ts};`);
    expect(await verifyMercadoPagoSignature({ secret, signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "999", nowMs })).toBe(false);
  });

  it("recusa notificação antiga (fora de 10 minutos)", async () => {
    const v1 = sign(`id:123;request-id:req-1;ts:${ts};`);
    expect(await verifyMercadoPagoSignature({ secret, signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123", nowMs: nowMs + 11 * 60_000 })).toBe(false);
  });
});

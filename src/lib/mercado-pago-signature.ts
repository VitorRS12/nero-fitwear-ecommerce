/** Validação da assinatura x-signature dos webhooks do Mercado Pago (HMAC-SHA256, Web Crypto). */

export interface ParsedSignature {
  ts: string;
  v1: string;
}

export function parseSignatureHeader(header: string | null): ParsedSignature | null {
  if (!header) return null;
  let ts = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    const value = rest.join("=").trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  return ts && v1 ? { ts, v1 } : null;
}

/** Monta o manifesto oficial: id:[data.id];request-id:[x-request-id];ts:[ts]; */
export function buildManifest(dataId: string | null, requestId: string | null, ts: string): string {
  let manifest = "";
  if (dataId) {
    const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
    manifest += `id:${id};`;
  }
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  return manifest;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyMercadoPagoSignature(params: {
  secret: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  /** Janela de tolerância em segundos (padrão 10 min). */
  toleranceSeconds?: number;
  nowMs?: number;
}): Promise<boolean> {
  const parsed = parseSignatureHeader(params.signatureHeader);
  if (!parsed || !params.secret) return false;
  const tsNum = Number(parsed.ts);
  if (!Number.isFinite(tsNum)) return false;
  const tsMs = tsNum > 1e12 ? tsNum : tsNum * 1000;
  const now = params.nowMs ?? Date.now();
  if (Math.abs(now - tsMs) > (params.toleranceSeconds ?? 600) * 1000) return false;
  const expected = await hmacHex(params.secret, buildManifest(params.dataId, params.requestId, parsed.ts));
  return safeEqual(expected, parsed.v1.toLowerCase());
}

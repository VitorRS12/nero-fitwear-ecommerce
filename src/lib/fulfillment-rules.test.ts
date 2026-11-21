import { describe, expect, it } from "vitest";
import { canMove, isLate } from "./fulfillment-rules";

describe("kanban de pedidos", () => {
  it("move livremente entre Pendentes, Em preparação e Aguardando envio", () => {
    expect(canMove("pending", "preparing", { isPickup: false }).ok).toBe(true);
    expect(canMove("pending", "awaiting_shipment", { isPickup: false }).ok).toBe(true);
    expect(canMove("preparing", "pending", { isPickup: false }).ok).toBe(true);
    expect(canMove("awaiting_shipment", "pending", { isPickup: false }).ok).toBe(true);
    expect(canMove("awaiting_shipment", "preparing", { isPickup: false }).ok).toBe(true);
  });
  it("não move para a mesma coluna nem sai de Enviados", () => {
    expect(canMove("pending", "pending", { isPickup: false })).toEqual({ ok: false, reason: "invalid_transition" });
    expect(canMove("shipped", "pending", { isPickup: false })).toEqual({ ok: false, reason: "invalid_transition" });
    expect(canMove("shipped", "awaiting_shipment", { isPickup: false })).toEqual({ ok: false, reason: "invalid_transition" });
  });
  it("Enviados só a partir de Aguardando envio", () => {
    expect(canMove("pending", "shipped", { isPickup: false, tracking: "AB123456789BR" })).toEqual({ ok: false, reason: "invalid_transition" });
    expect(canMove("preparing", "shipped", { isPickup: false, tracking: "AB123456789BR" })).toEqual({ ok: false, reason: "invalid_transition" });
  });
  it("Enviados exige rastreio válido dos Correios", () => {
    expect(canMove("awaiting_shipment", "shipped", { isPickup: false })).toEqual({ ok: false, reason: "tracking_required" });
    expect(canMove("awaiting_shipment", "shipped", { isPickup: false, tracking: "AB123" }).ok).toBe(false);
    expect(canMove("awaiting_shipment", "shipped", { isPickup: false, tracking: "ab123456789br" }).ok).toBe(true);
  });
  it("retirada no local conclui sem rastreio", () => {
    expect(canMove("awaiting_shipment", "shipped", { isPickup: true }).ok).toBe(true);
  });
  it("atrasado após 48h na etapa, nunca em Enviados", () => {
    const now = Date.parse("2026-11-20T12:00:00Z");
    expect(isLate("pending", "2026-11-18T11:00:00Z", now)).toBe(true);
    expect(isLate("pending", "2026-11-19T12:00:00Z", now)).toBe(false);
    expect(isLate("shipped", "2026-01-01T00:00:00Z", now)).toBe(false);
  });
});

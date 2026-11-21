export const FULFILLMENT_STAGES = ["pending", "preparing", "awaiting_shipment", "shipped"] as const;
export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export const STAGE_LABEL: Record<FulfillmentStage, string> = {
  pending: "Pendentes",
  preparing: "Em preparação",
  awaiting_shipment: "Aguardando envio",
  shipped: "Enviados",
};

export const TRACKING_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
/** Horas na mesma etapa (antes de Enviados) para o pedido ser marcado como atrasado. */
export const LATE_AFTER_HOURS = 48;

export function nextStage(stage: FulfillmentStage): FulfillmentStage | null {
  const i = FULFILLMENT_STAGES.indexOf(stage);
  return i >= 0 && i < FULFILLMENT_STAGES.length - 1 ? (FULFILLMENT_STAGES[i + 1] ?? null) : null;
}

export type MoveCheck = { ok: true } | { ok: false; reason: "invalid_transition" | "tracking_required" };

export function canMove(from: FulfillmentStage, to: FulfillmentStage, opts: { isPickup: boolean; tracking?: string | null }): MoveCheck {
  if (from === to || from === "shipped") return { ok: false, reason: "invalid_transition" };
  if (to !== "shipped") return { ok: true };
  // Enviados só a partir de Aguardando envio.
  if (from !== "awaiting_shipment") return { ok: false, reason: "invalid_transition" };
  if (!opts.isPickup) {
    const code = (opts.tracking ?? "").trim().toUpperCase();
    if (!TRACKING_REGEX.test(code)) return { ok: false, reason: "tracking_required" };
  }
  return { ok: true };
}

export function isLate(stage: FulfillmentStage, enteredAt: string, now = Date.now()): boolean {
  if (stage === "shipped") return false;
  return now - new Date(enteredAt).getTime() > LATE_AFTER_HOURS * 3600_000;
}

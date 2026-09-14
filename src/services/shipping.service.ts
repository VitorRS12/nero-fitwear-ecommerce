import type { ShippingOption } from "@/types/cart";

/**
 * Tabela de frete provisória por região (decisão pendente: contrato real
 * com transportadora). Isolada aqui para que a troca por Correios/Melhor
 * Envio não afete a interface.
 */
const REGION_BY_STATE: Record<string, "N" | "NE" | "CO" | "SE" | "S"> = {
  AC: "N",
  AP: "N",
  AM: "N",
  PA: "N",
  RO: "N",
  RR: "N",
  TO: "N",
  AL: "NE",
  BA: "NE",
  CE: "NE",
  MA: "NE",
  PB: "NE",
  PE: "NE",
  PI: "NE",
  RN: "NE",
  SE: "NE",
  DF: "CO",
  GO: "CO",
  MT: "CO",
  MS: "CO",
  ES: "SE",
  MG: "SE",
  RJ: "SE",
  SP: "SE",
  PR: "S",
  RS: "S",
  SC: "S",
};

const TABLE: Record<string, { standard: [number, number]; express: [number, number] }> = {
  N: { standard: [39.9, 12], express: [69.9, 6] },
  NE: { standard: [29.9, 9], express: [54.9, 4] },
  CO: { standard: [27.9, 8], express: [49.9, 4] },
  SE: { standard: [19.9, 5], express: [34.9, 2] },
  S: { standard: [24.9, 7], express: [44.9, 3] },
};

export const FREE_SHIPPING_THRESHOLD = 399;

export function getShippingOptions(state: string, subtotal: number): ShippingOption[] {
  const region = REGION_BY_STATE[state?.toUpperCase()] ?? "SE";
  const config = TABLE[region]!;
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return [
    {
      id: "standard",
      label: "Entrega padrão",
      price: freeShipping ? 0 : config.standard[0],
      etaDays: config.standard[1],
    },
    {
      id: "express",
      label: "Entrega expressa",
      price: config.express[0],
      etaDays: config.express[1],
    },
  ];
}

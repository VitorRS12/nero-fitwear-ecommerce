import { getShippingOptions, PICKUP_OPTION } from "@/services/shipping.service";
import type { ShippingOption } from "@/types/cart";

export type PaymentMethod = "pix" | "card";

export interface CheckoutAddress {
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
}

/** Endereço da loja para retirada; também enviado como endereço do pedido quando o cliente retira. */
export const PICKUP_ADDRESS: CheckoutAddress = {
  zipCode: "42850-000",
  state: "BA",
  city: "Dias d'Ávila",
  neighborhood: "Santa Terezinha",
  street: "Rua Jaime Ribeiro da Silva",
  number: "101",
  complement: "Casa",
};

export function availableShipping(state: string, subtotal: number): ShippingOption[] {
  const delivery = state.trim().length === 2 ? getShippingOptions(state, subtotal) : [];
  return [...delivery, PICKUP_OPTION];
}

export function checkoutTotal(subtotal: number, discount: number, shipping: number): number {
  return Math.max(0, subtotal - discount + shipping);
}
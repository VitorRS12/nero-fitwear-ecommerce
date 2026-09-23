import { getShippingOptions } from "@/services/shipping.service";
import { ShippingOption } from "@/types/cart";

export type paymentMethod = "pix" | "card";

export interface CheckoutAddress { 
    zipCode: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement: string;
}

export function availableShipping(state: string, subtotal: number): ShippingOption[] {
    return state.trim().length === 2 ? getShippingOptions(state, subtotal) : [];
}

export function checkoutTotal(subtotal: number, discount: number, shipping: number): number {
    return Math.max(0, subtotal - discount + shipping); 
}
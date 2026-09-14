import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { AppliedCoupon, CartItem, CartTotals } from "@/types/cart";

const STORAGE_KEY = "nero.cart.v1";

interface CartContextValue {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  totals: CartTotals;
  isHydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  applyCoupon: (coupon: AppliedCoupon | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface PersistedCart {
  items: CartItem[];
  coupon: AppliedCoupon | null;
}

function readStorage(): PersistedCart {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], coupon: null };
    const parsed = JSON.parse(raw) as PersistedCart;
    return { items: parsed.items ?? [], coupon: parsed.coupon ?? null };
  } catch {
    return { items: [], coupon: null };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    setItems(stored.items);
    setCoupon(stored.coupon);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, coupon }));
  }, [items, coupon, isHydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (!existing) return [...current, item];
      return current.map((entry) =>
        entry.variantId === item.variantId
          ? {
              ...entry,
              quantity: Math.min(entry.quantity + item.quantity, entry.maxStock),
            }
          : entry,
      );
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current.flatMap((entry) => {
        if (entry.variantId !== variantId) return [entry];
        const next = Math.max(0, Math.min(quantity, entry.maxStock));
        return next === 0 ? [] : [{ ...entry, quantity: next }];
      }),
    );
  }, []);

  const applyCoupon = useCallback((next: AppliedCoupon | null) => setCoupon(next), []);
  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = !coupon
      ? 0
      : coupon.discountType === "percent"
        ? (subtotal * coupon.discountValue) / 100
        : Math.min(coupon.discountValue, subtotal);

    return {
      subtotal,
      discount,
      shipping: 0,
      total: Math.max(0, subtotal - discount),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items, coupon]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      coupon,
      totals,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      applyCoupon,
      clear,
    }),
    [items, coupon, totals, isHydrated, addItem, removeItem, updateQuantity, applyCoupon, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return context;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  color: string | null;
  size: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface AppliedCoupon {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
}

export interface ShippingOption {
  id: string;
  label: string;
  price: number;
  etaDays: number;
}

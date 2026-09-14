export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);

export const formatDate = (value: string | Date): string =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    typeof value === "string" ? new Date(value) : value,
  );

/** Preço efetivo de uma variação (variação sobrescreve o produto). */
export const effectivePrice = (
  product: { base_price: number; sale_price: number | null },
  variantPrice?: number | null,
): number => variantPrice ?? product.sale_price ?? product.base_price;

export const hasDiscount = (product: { base_price: number; sale_price: number | null }): boolean =>
  product.sale_price != null && product.sale_price < product.base_price;

export const discountPercent = (product: {
  base_price: number;
  sale_price: number | null;
}): number =>
  hasDiscount(product)
    ? Math.round((1 - (product.sale_price as number) / product.base_price) * 100)
    : 0;

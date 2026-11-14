export type StockLevel = "out" | "low" | "ok";

export function stockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "ok";
}

export function nextStock(current: number, mode: "add" | "set", quantity: number): number {
  return mode === "add" ? current + quantity : quantity;
}

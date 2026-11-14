import { describe, expect, it } from "vitest";
import { nextStock, stockLevel } from "./inventory-rules";

describe("estoque", () => {
  it("zerado é esgotado", () => expect(stockLevel(0, 3)).toBe("out"));
  it("igual ao limite é baixo", () => expect(stockLevel(3, 3)).toBe("low"));
  it("acima do limite é normal", () => expect(stockLevel(4, 3)).toBe("ok"));
  it("entrada soma", () => expect(nextStock(5, "add", 4)).toBe(9));
  it("ajuste substitui a contagem", () => expect(nextStock(5, "set", 2)).toBe(2));
});

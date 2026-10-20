import { describe, expect, it } from "vitest";

import { availableShipping } from "./checkout.service";

describe("retirada no local", () => {
  it("aparece sempre e é grátis, mesmo sem UF", () => {
    const pickup = availableShipping("", 100).find((o) => o.id === "pickup");
    expect(pickup?.price).toBe(0);
  });
});

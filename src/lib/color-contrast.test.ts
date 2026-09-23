import { describe, expect, it } from "vitest";
import { contrastRatio, isLowContrast } from "./color-contrast";

describe("contrastRatio", () => {
  it("is 1 for identical colours", () => {
    expect(contrastRatio("#2f5be4", "#2f5be4")).toBeCloseTo(1, 5);
  });

  it("is 21 for black on white, either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });
});

describe("isLowContrast", () => {
  it("is false for a dark colour on white", () => {
    expect(isLowContrast("#101828", "#ffffff")).toBe(false);
  });

  it("is true for a pale colour on white", () => {
    expect(isLowContrast("#fdf6e3", "#ffffff")).toBe(true);
  });

  it("never blocks — it's just a boolean the caller can ignore", () => {
    expect(typeof isLowContrast("#ffff00", "#ffffff")).toBe("boolean");
  });
});

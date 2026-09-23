import { describe, expect, it } from "vitest";
import { hexToHsv, hsvToHex } from "./hsv-color";

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

describe("hexToHsv / hsvToHex round trip", () => {
  it.each(["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000", "#808080"])("round-trips %s exactly", (hex) => {
    const hsv = hexToHsv(hex);
    expect(hsv).not.toBeNull();
    expect(hsvToHex(hsv!)).toBe(hex);
  });

  // Rounding h/s/v to whole degrees/percent is lossy for an arbitrary colour — each
  // channel should still land within a couple of levels of the original.
  it("round-trips an arbitrary colour within a small tolerance", () => {
    const hsv = hexToHsv("#2f5be4");
    expect(hsv).not.toBeNull();
    const [r1, g1, b1] = channels("#2f5be4");
    const [r2, g2, b2] = channels(hsvToHex(hsv!));
    for (const [a, b] of [[r1, r2], [g1, g2], [b1, b2]]) expect(Math.abs(a - b)).toBeLessThanOrEqual(3);
  });
});

describe("hexToHsv", () => {
  it("returns null for a malformed hex", () => {
    expect(hexToHsv("#fff")).toBeNull();
    expect(hexToHsv("red")).toBeNull();
  });

  it("reads pure red as hue 0, full saturation and value", () => {
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 100, v: 100 });
  });
});

describe("hsvToHex", () => {
  it("renders black regardless of hue/saturation when value is 0", () => {
    expect(hsvToHex({ h: 200, s: 50, v: 0 })).toBe("#000000");
  });

  it("renders white when saturation is 0 and value is 100", () => {
    expect(hsvToHex({ h: 0, s: 0, v: 100 })).toBe("#ffffff");
  });
});

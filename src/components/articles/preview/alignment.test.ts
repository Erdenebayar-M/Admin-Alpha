import { describe, expect, it } from "vitest";
import { alignmentClass } from "./alignment";

describe("alignmentClass", () => {
  it.each([
    ["center" as const, "text-center"],
    ["right" as const, "text-right"],
    [undefined, "text-left"],
  ])("maps %s to %s", (alignment, expected) => {
    expect(alignmentClass(alignment)).toBe(expected);
  });
});

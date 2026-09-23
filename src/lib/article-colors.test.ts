import { describe, expect, it } from "vitest";
import { colorCss, tintCss, usedCustomColors } from "./article-colors";
import type { ArticleBlock } from "./article-types";

describe("colorCss", () => {
  it("resolves a Palette name to its CSS var", () => {
    expect(colorCss("brand-blue")).toBe("var(--color-palette-brand-blue)");
  });

  it("passes a custom hex through unchanged", () => {
    expect(colorCss("#2f5be4")).toBe("#2f5be4");
  });
});

describe("tintCss", () => {
  it("resolves a Palette name to its tint CSS var", () => {
    expect(tintCss("red")).toBe("var(--color-palette-red-tint)");
  });

  it("mixes a custom hex with white", () => {
    expect(tintCss("#2f5be4")).toBe("color-mix(in srgb, #2f5be4 16%, white)");
  });
});

describe("usedCustomColors", () => {
  it("collects custom hexes from spans, heading colour and Block background, deduped and in first-seen order", () => {
    const blocks: ArticleBlock[] = [
      { id: "p1", type: "paragraph", content: [{ text: "a", color: "#111111" }, { text: "b", highlight: "#222222" }], background: "#111111" },
      { id: "h1", type: "heading", level: 2, text: "H", color: "#333333" },
      { id: "l1", type: "list", style: "bullet", items: [[{ text: "x", color: "#222222" }]] },
      { id: "d1", type: "divider" },
    ];
    expect(usedCustomColors(blocks)).toEqual(["#111111", "#222222", "#333333"]);
  });

  it("ignores Palette names", () => {
    const blocks: ArticleBlock[] = [{ id: "p1", type: "paragraph", content: [{ text: "a", color: "red" }], background: "gray" }];
    expect(usedCustomColors(blocks)).toEqual([]);
  });

  it("is empty for a Body with no colours", () => {
    expect(usedCustomColors([{ id: "p1", type: "paragraph", content: [{ text: "a" }] }])).toEqual([]);
  });
});

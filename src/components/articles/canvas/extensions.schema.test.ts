import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { DOC_MARK, DOC_NODE } from "@/lib/article-body";
import { createColorMenuStore } from "./color/color-menu-store";
import { articleCanvasExtensions } from "./extensions";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

/**
 * `article-body.test.ts` exercises the Block <-> JSONContent conversion as
 * plain data; this checks the other half — that the actual Tiptap schema
 * `articleCanvasExtensions` builds accepts the marks/attrs that conversion
 * assumes exist (Admin-Alpha#9's `textColor`/`highlightColor` marks and the
 * `color`/`background` node attrs). `getSchema` builds the schema without a
 * DOM view, so this runs in plain Node.
 */
function schema() {
  return getSchema(articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()));
}

describe("articleCanvasExtensions schema", () => {
  it("registers the textColor and highlightColor marks with a color attr", () => {
    const s = schema();
    expect(s.marks[DOC_MARK.color]).toBeDefined();
    expect(s.marks[DOC_MARK.highlight]).toBeDefined();
    const mark = s.marks[DOC_MARK.color].create({ color: "brand-blue" });
    expect(mark.attrs.color).toBe("brand-blue");
  });

  it("gives every Block kind that can carry one a background attr, and heading a color attr", () => {
    const s = schema();
    for (const type of [DOC_NODE.paragraph, DOC_NODE.heading, DOC_NODE.bulletList, DOC_NODE.orderedList, DOC_NODE.quote, DOC_NODE.callout]) {
      expect(s.nodes[type].spec.attrs).toHaveProperty("background");
    }
    expect(s.nodes[DOC_NODE.heading].spec.attrs).toHaveProperty("color");
  });

  it("builds a paragraph node carrying both a background attr and coloured text without throwing", () => {
    const s = schema();
    const text = s.text("улаан", [s.marks[DOC_MARK.color].create({ color: "red" })]);
    const paragraph = s.nodes[DOC_NODE.paragraph].create({ background: "#112233" }, text);
    expect(paragraph.attrs.background).toBe("#112233");
    expect(paragraph.firstChild?.marks[0].attrs.color).toBe("red");
  });

  it("gives every Block kind that can carry one an alignment attr, and none to divider/preserved (Admin-Alpha#10)", () => {
    const s = schema();
    for (const type of [DOC_NODE.paragraph, DOC_NODE.heading, DOC_NODE.bulletList, DOC_NODE.orderedList, DOC_NODE.quote, DOC_NODE.callout]) {
      expect(s.nodes[type].spec.attrs).toHaveProperty("alignment");
    }
    for (const type of [DOC_NODE.divider, DOC_NODE.preserved]) {
      expect(s.nodes[type].spec.attrs).not.toHaveProperty("alignment");
    }
  });

  it("builds a paragraph node carrying a center alignment without throwing", () => {
    const s = schema();
    const paragraph = s.nodes[DOC_NODE.paragraph].create({ alignment: "center" }, s.text("төвд"));
    expect(paragraph.attrs.alignment).toBe("center");
  });
});

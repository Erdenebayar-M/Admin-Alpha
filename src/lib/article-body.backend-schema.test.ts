import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { docToBlocks, type TiptapDocument } from "./article-body";

// The sibling Alpha repo's shared schema is what the backend validates a save against.
// Skipped when that checkout isn't next to this one.
const SCHEMA_PATH = resolve(__dirname, "../../../Alpha/shared/src/validators/article.ts");

const text = (t: string, marks: object[] = []) => ({ type: "text", text: t, marks });
const doc = (...content: object[]) => ({ type: "doc", content }) as unknown as TiptapDocument;

describe.skipIf(!existsSync(SCHEMA_PATH))("docToBlocks output vs the backend's Article Body schema", () => {
  it("is accepted for bold/colour/highlight text, list items and coloured list markers", async () => {
    const { articleBodySchema } = await import(/* @vite-ignore */ SCHEMA_PATH);
    const blocks = docToBlocks(
      doc(
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            text("a", [{ type: "bold" }, { type: "textColor", attrs: { color: "red" } }]),
            text("b", [{ type: "highlightColor", attrs: { color: "#ffee00" } }]),
          ],
        },
        {
          type: "orderedList",
          attrs: { blockId: "l", start: 3 },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "listMarker", attrs: { color: "brand-blue" } }, text("c", [{ type: "bold" }])],
                },
              ],
            },
          ],
        },
      ),
    );
    const result = articleBodySchema.safeParse(blocks);
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it("is accepted for an indented paragraph, and for an indented paragraph the canvas later centred (ADR 0006)", async () => {
    const { articleBodySchema } = await import(/* @vite-ignore */ SCHEMA_PATH);
    const blocks = docToBlocks(
      doc(
        { type: "paragraph", attrs: { blockId: "p1", indent: true }, content: [text("догол мөр")] },
        { type: "paragraph", attrs: { blockId: "p2", indent: true, alignment: "center" }, content: [text("төвд")] },
      ),
    );
    expect(blocks[0]).toMatchObject({ indent: true });
    const result = articleBodySchema.safeParse(blocks);
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it.each([
    ["a centred paragraph", { id: "p", type: "paragraph", content: [{ text: "a" }], alignment: "center", indent: true }],
    ["a right-aligned paragraph", { id: "p", type: "paragraph", content: [{ text: "a" }], alignment: "right", indent: true }],
    ["a heading", { id: "h", type: "heading", level: 2, text: "a", indent: true }],
    ["a list", { id: "l", type: "list", style: "bullet", items: [{ spans: [{ text: "a" }] }], indent: true }],
    ["a quote", { id: "q", type: "quote", content: [{ text: "a" }], indent: true }],
    ["a callout", { id: "c", type: "callout", content: [{ text: "a" }], indent: true }],
    ["a divider", { id: "d", type: "divider", indent: true }],
  ])("rejects an indent on %s", async (_label, block) => {
    const { articleBodySchema } = await import(/* @vite-ignore */ SCHEMA_PATH);
    expect(articleBodySchema.safeParse([block]).success).toBe(false);
  });
});

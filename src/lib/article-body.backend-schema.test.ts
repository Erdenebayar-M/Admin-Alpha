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
});

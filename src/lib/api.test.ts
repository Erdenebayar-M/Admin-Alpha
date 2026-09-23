import { describe, expect, it } from "vitest";
import { normalizeArticle } from "./api";
import type { Article } from "./types";
import type { ArticleBlock } from "./article-types";

function articleWithBody(body: ArticleBlock[]): Article {
  return { body } as Article;
}

describe("normalizeArticle", () => {
  it("wraps a pre-ADR-0005 list item (InlineSpan[] directly) into the current { spans, markerColor? } shape", () => {
    const legacySpans = [{ text: "нэг" }];
    // Old backend shape: items was InlineSpan[][] directly, not ListItem[].
    const body = [{ id: "b1", type: "list", style: "bullet", items: [legacySpans] }] as unknown as ArticleBlock[];

    const { body: normalized } = normalizeArticle(articleWithBody(body));
    const list = normalized[0];
    if (list.type !== "list") throw new Error("expected a list block");
    expect(list.items).toEqual([{ spans: legacySpans }]);
  });

  it("leaves an already-current list item ({ spans, markerColor }) unchanged", () => {
    const body: ArticleBlock[] = [
      {
        id: "b1",
        type: "list",
        style: "ordered",
        items: [{ spans: [{ text: "нэг" }], markerColor: "red" }],
      },
    ];

    const { body: normalized } = normalizeArticle(articleWithBody(body));
    const list = normalized[0];
    if (list.type !== "list") throw new Error("expected a list block");
    expect(list.items).toEqual([{ spans: [{ text: "нэг" }], markerColor: "red" }]);
  });

  it("leaves non-list Blocks untouched", () => {
    const body: ArticleBlock[] = [{ id: "b1", type: "paragraph", content: [{ text: "хэл" }] }];
    expect(normalizeArticle(articleWithBody(body)).body).toEqual(body);
  });
});

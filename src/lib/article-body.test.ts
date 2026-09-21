import { describe, expect, it } from "vitest";
import { blocksToDoc, docToBlocks, type TiptapDocument } from "./article-body";
import type { ArticleBlock } from "./article-types";

const roundTrip = (blocks: ArticleBlock[]) => docToBlocks(blocksToDoc(blocks));

describe("blocksToDoc / docToBlocks round trip", () => {
  it("keeps a paragraph with mixed bold, italic and link spans", () => {
    const blocks: ArticleBlock[] = [
      {
        id: "p1",
        type: "paragraph",
        content: [
          { text: "Энгийн " },
          { text: "тод", bold: true },
          { text: " ба " },
          { text: "налуу", italic: true },
          { text: " ба " },
          { text: "хоёулаа холбоос", bold: true, italic: true, href: "https://example.com" },
          { text: " мөн " },
          { text: "дотоод", href: "/articles/x" },
          { text: " ба " },
          { text: "имэйл", href: "mailto:a@b.mn" },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps headings at level 2 and 3", () => {
    const blocks: ArticleBlock[] = [
      { id: "h2", type: "heading", level: 2, text: "Дэд гарчиг" },
      { id: "h3", type: "heading", level: 3, text: "Жижиг гарчиг" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps bullet and ordered lists with several items", () => {
    const blocks: ArticleBlock[] = [
      { id: "l1", type: "list", style: "bullet", items: [[{ text: "нэг" }], [{ text: "хоёр", bold: true }]] },
      {
        id: "l2",
        type: "list",
        style: "ordered",
        items: [[{ text: "эхний " }, { text: "алхам", italic: true }], [{ text: "дараагийн" }], [{ text: "сүүлийн" }]],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a quote with an attribution", () => {
    const blocks: ArticleBlock[] = [
      { id: "q1", type: "quote", content: [{ text: "Эрдэм номын дээж" }], attribution: "Зүйр үг" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a quote without an attribution", () => {
    const blocks: ArticleBlock[] = [{ id: "q2", type: "quote", content: [{ text: "Ишлэл", italic: true }] }];
    const result = roundTrip(blocks);
    expect(result).toEqual(blocks);
    expect(result[0]).not.toHaveProperty("attribution");
  });

  it("keeps a callout and a divider", () => {
    const blocks: ArticleBlock[] = [
      { id: "c1", type: "callout", content: [{ text: "Анхаар: ", bold: true }, { text: "чухал" }] },
      { id: "d1", type: "divider" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps media Blocks it can't edit yet untouched", () => {
    const blocks: ArticleBlock[] = [
      { id: "i1", type: "image", url: "https://cdn.example.com/a.jpg", alt: "Зураг", caption: "Тайлбар", width: 800, height: 600 },
      { id: "v1", type: "video", provider: "youtube", video_id: "dQw4w9WgXcQ" },
      { id: "v2", type: "video", provider: "vimeo", video_id: "76979871" },
      { id: "k1", type: "link_card", url: "https://example.com", title: "Холбоос" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps every kind together, in order", () => {
    const blocks: ArticleBlock[] = [
      { id: "a", type: "heading", level: 2, text: "Гарчиг" },
      { id: "b", type: "paragraph", content: [{ text: "Текст" }] },
      { id: "c", type: "list", style: "bullet", items: [[{ text: "x" }]] },
      { id: "d", type: "divider" },
      { id: "e", type: "quote", content: [{ text: "q" }], attribution: "Би" },
      { id: "f", type: "callout", content: [{ text: "c" }] },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });
});

describe("blocksToDoc", () => {
  it("gives an empty Body one empty paragraph to type into", () => {
    expect(blocksToDoc([])).toEqual({ type: "doc", content: [{ type: "paragraph", attrs: { blockId: null } }] });
  });
});

describe("docToBlocks", () => {
  const ids = () => {
    let n = 0;
    return () => `gen-${++n}`;
  };

  it("drops empty and whitespace-only paragraphs", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        { type: "paragraph", attrs: { blockId: "p1" } },
        { type: "paragraph", attrs: { blockId: "p2" }, content: [{ type: "text", text: "Текст" }] },
        { type: "paragraph", attrs: { blockId: "p3" }, content: [{ type: "text", text: "   " }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ id: "p2", type: "paragraph", content: [{ text: "Текст" }] }]);
  });

  it("drops empty headings, callouts, quotes and list items the schema would reject", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        { type: "heading", attrs: { blockId: "h", level: 2 } },
        { type: "callout", attrs: { blockId: "c" } },
        { type: "quote", attrs: { blockId: "q", attribution: "Хэн нэгэн" } },
        {
          type: "bulletList",
          attrs: { blockId: "l" },
          content: [
            { type: "listItem", content: [{ type: "paragraph" }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }] },
          ],
        },
        { type: "orderedList", attrs: { blockId: "l2" }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ id: "l", type: "list", style: "bullet", items: [[{ text: "a" }]] }]);
  });

  it("gives a Block without an id, or with a repeated id, a fresh one", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a" }] },
        { type: "paragraph", attrs: { blockId: "same" }, content: [{ type: "text", text: "b" }] },
        { type: "paragraph", attrs: { blockId: "same" }, content: [{ type: "text", text: "c" }] },
      ],
    };
    expect(docToBlocks(doc, ids()).map((b) => b.id)).toEqual(["gen-1", "same", "gen-2"]);
  });

  it("merges adjacent text with the same formatting into one span", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            { type: "text", text: "a", marks: [{ type: "bold" }] },
            { type: "text", text: "b", marks: [{ type: "bold" }] },
            { type: "text", text: "c" },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      { id: "p", type: "paragraph", content: [{ text: "ab", bold: true }, { text: "c" }] },
    ]);
  });

  it("keeps the text but drops a link whose href the backend would reject", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            { type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
            { type: "text", text: " proto", marks: [{ type: "link", attrs: { href: "//evil.example" } }] },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ id: "p", type: "paragraph", content: [{ text: "bad proto" }] }]);
  });

  it("trims the attribution and omits it when blank", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        { type: "quote", attrs: { blockId: "q1", attribution: "  Нэр  " }, content: [{ type: "text", text: "a" }] },
        { type: "quote", attrs: { blockId: "q2", attribution: "   " }, content: [{ type: "text", text: "b" }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      { id: "q1", type: "quote", content: [{ text: "a" }], attribution: "Нэр" },
      { id: "q2", type: "quote", content: [{ text: "b" }] },
    ]);
  });
});

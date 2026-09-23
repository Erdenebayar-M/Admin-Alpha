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
      {
        id: "l1",
        type: "list",
        style: "bullet",
        items: [{ spans: [{ text: "нэг" }] }, { spans: [{ text: "хоёр", bold: true }] }],
      },
      {
        id: "l2",
        type: "list",
        style: "ordered",
        items: [
          { spans: [{ text: "эхний " }, { text: "алхам", italic: true }] },
          { spans: [{ text: "дараагийн" }] },
          { spans: [{ text: "сүүлийн" }] },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a list item's marker colour, independent of the item's text colour", () => {
    const blocks: ArticleBlock[] = [
      {
        id: "l1",
        type: "list",
        style: "bullet",
        items: [
          { spans: [{ text: "улаан үгтэй", color: "red" }], markerColor: "brand-blue" },
          { spans: [{ text: "энгийн" }] },
          { spans: [{ text: "захиалгат тэмдэг" }], markerColor: "#a1b2c3" },
        ],
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps an ordered list's startsAt, continuing a split list's numbering", () => {
    const blocks: ArticleBlock[] = [
      { id: "l1", type: "list", style: "ordered", items: [{ spans: [{ text: "гуравдугаар" }] }], startsAt: 3 },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a list with no marker colour and no startsAt round-tripping with those fields still absent", () => {
    const blocks: ArticleBlock[] = [
      { id: "l1", type: "list", style: "bullet", items: [{ spans: [{ text: "нэг" }] }] },
      { id: "l2", type: "list", style: "ordered", items: [{ spans: [{ text: "хоёр" }] }] },
    ];
    const result = roundTrip(blocks);
    expect(result).toEqual(blocks);
    for (const block of result) {
      expect(block).not.toHaveProperty("startsAt");
      if (block.type === "list") for (const item of block.items) expect(item).not.toHaveProperty("markerColor");
    }
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

  it("keeps an image Block's data exactly, with a caption", () => {
    const blocks: ArticleBlock[] = [
      { id: "i1", type: "image", url: "https://cdn.example.com/a.jpg", alt: "Зураг", caption: "Тайлбар", width: 800, height: 600 },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps an image Block's data exactly, without a caption", () => {
    const blocks: ArticleBlock[] = [
      { id: "i2", type: "image", url: "https://cdn.example.com/b.jpg", alt: "Зураг 2", width: 400, height: 300 },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a video Block for both providers", () => {
    const blocks: ArticleBlock[] = [
      { id: "v1", type: "video", provider: "youtube", video_id: "dQw4w9WgXcQ" },
      { id: "v2", type: "video", provider: "vimeo", video_id: "76979871" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a link card Block, without an image", () => {
    const blocks: ArticleBlock[] = [{ id: "k1", type: "link_card", url: "https://example.com", title: "Холбоос" }];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a link card Block, with an image", () => {
    const blocks: ArticleBlock[] = [
      {
        id: "k2",
        type: "link_card",
        url: "https://example.com/article",
        title: "Холбоос",
        description: "Товч тайлбар",
        image: { url: "https://cdn.example.com/c.jpg", alt: "Карт зураг", width: 200, height: 150 },
      },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a text colour, a highlight, a subheading colour and a Block background — Palette and custom", () => {
    const blocks: ArticleBlock[] = [
      {
        id: "p1",
        type: "paragraph",
        content: [
          { text: "улаан", color: "red" },
          { text: " ба " },
          { text: "захиалгат", color: "#a1b2c3" },
          { text: " ба " },
          { text: "тодруулсан", highlight: "yellow" },
        ],
        background: "gray",
      },
      { id: "h1", type: "heading", level: 2, text: "Өнгөт гарчиг", color: "brand-blue", background: "#112233" },
      { id: "l1", type: "list", style: "bullet", items: [{ spans: [{ text: "нэг", highlight: "#ffcc00" }] }], background: "brown" },
      { id: "q1", type: "quote", content: [{ text: "ишлэл", color: "purple" }], background: "pink" },
      { id: "c1", type: "callout", content: [{ text: "анхаар", highlight: "orange" }], background: "#000000" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a center or right alignment on each of the five text Block kinds", () => {
    const blocks: ArticleBlock[] = [
      { id: "p1", type: "paragraph", content: [{ text: "төвд" }], alignment: "center" },
      { id: "h1", type: "heading", level: 2, text: "баруунд", alignment: "right" },
      { id: "l1", type: "list", style: "bullet", items: [{ spans: [{ text: "нэг" }] }], alignment: "center" },
      { id: "q1", type: "quote", content: [{ text: "ишлэл" }], alignment: "right" },
      { id: "c1", type: "callout", content: [{ text: "анхаар" }], alignment: "center" },
    ];
    expect(roundTrip(blocks)).toEqual(blocks);
  });

  it("keeps a Block with no alignment field round-tripping with the field still absent", () => {
    const blocks: ArticleBlock[] = [
      { id: "p1", type: "paragraph", content: [{ text: "текст" }] },
      { id: "h1", type: "heading", level: 2, text: "гарчиг" },
      { id: "l1", type: "list", style: "bullet", items: [{ spans: [{ text: "нэг" }] }] },
      { id: "q1", type: "quote", content: [{ text: "ишлэл" }] },
      { id: "c1", type: "callout", content: [{ text: "анхаар" }] },
    ];
    const result = roundTrip(blocks);
    expect(result).toEqual(blocks);
    for (const block of result) expect(block).not.toHaveProperty("alignment");
  });

  it("sends no alignment for an image, video, link card or divider Block", () => {
    const blocks: ArticleBlock[] = [
      { id: "i1", type: "image", url: "https://cdn.example.com/a.jpg", alt: "a" },
      { id: "v1", type: "video", provider: "youtube", video_id: "dQw4w9WgXcQ" },
      { id: "k1", type: "link_card", url: "https://example.com", title: "t" },
      { id: "d1", type: "divider" },
    ];
    for (const block of blocks) {
      const node = blocksToDoc([block]).content?.[0];
      expect(node?.attrs).not.toHaveProperty("alignment");
    }
  });

  it("never puts both color and highlight on one span", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            {
              type: "text",
              text: "хоёул",
              marks: [
                { type: "textColor", attrs: { color: "red" } },
                { type: "highlightColor", attrs: { color: "yellow" } },
              ],
            },
          ],
        },
      ],
    };
    const [block] = docToBlocks(doc);
    expect(block).toEqual({ id: "p", type: "paragraph", content: [{ text: "хоёул", color: "red" }] });
  });

  it("sends a link span uncoloured even when a colour mark is present", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            {
              type: "text",
              text: "холбоос",
              marks: [{ type: "link", attrs: { href: "https://a.mn" } }, { type: "textColor", attrs: { color: "red" } }],
            },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ id: "p", type: "paragraph", content: [{ text: "холбоос", href: "https://a.mn" }] }]);
  });

  it("sends no background for an image, video, link card or divider Block", () => {
    const blocks: ArticleBlock[] = [
      { id: "i1", type: "image", url: "https://cdn.example.com/a.jpg", alt: "a" },
      { id: "v1", type: "video", provider: "youtube", video_id: "dQw4w9WgXcQ" },
      { id: "k1", type: "link_card", url: "https://example.com", title: "t" },
      { id: "d1", type: "divider" },
    ];
    for (const block of blocks) {
      const node = blocksToDoc([block]).content?.[0];
      expect(node?.attrs).not.toHaveProperty("background");
    }
  });

  it("merges adjacent spans only when colour and highlight also match", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { blockId: "p" },
          content: [
            { type: "text", text: "a", marks: [{ type: "textColor", attrs: { color: "red" } }] },
            { type: "text", text: "b", marks: [{ type: "textColor", attrs: { color: "red" } }] },
            { type: "text", text: "c", marks: [{ type: "textColor", attrs: { color: "brand-blue" } }] },
            { type: "text", text: "d", marks: [{ type: "highlightColor", attrs: { color: "brand-blue" } }] },
            { type: "text", text: "e" },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      {
        id: "p",
        type: "paragraph",
        content: [
          { text: "ab", color: "red" },
          { text: "c", color: "brand-blue" },
          { text: "d", highlight: "brand-blue" },
          { text: "e" },
        ],
      },
    ]);
  });

  it("keeps every kind together, in order", () => {
    const blocks: ArticleBlock[] = [
      { id: "a", type: "heading", level: 2, text: "Гарчиг" },
      { id: "b", type: "paragraph", content: [{ text: "Текст" }] },
      { id: "c", type: "list", style: "bullet", items: [{ spans: [{ text: "x" }] }] },
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

  it("gives every list item a listMarker node as the first child of its paragraph, carrying its markerColor", () => {
    const doc = blocksToDoc([
      {
        id: "l1",
        type: "list",
        style: "ordered",
        items: [
          { spans: [{ text: "нэг" }], markerColor: "brand-blue" },
          { spans: [{ text: "хоёр" }] },
        ],
      },
    ]);
    const list = doc.content?.[0];
    const [item1, item2] = list?.content ?? [];
    expect(item1?.content?.[0]?.content?.[0]).toEqual({ type: "listMarker", attrs: { color: "brand-blue" } });
    expect(item2?.content?.[0]?.content?.[0]).toEqual({ type: "listMarker", attrs: { color: null } });
  });

  it("sets an orderedList/bulletList node's start attr from startsAt, defaulting to 1", () => {
    const withStart = blocksToDoc([{ id: "l1", type: "list", style: "ordered", items: [{ spans: [{ text: "x" }] }], startsAt: 4 }]);
    expect(withStart.content?.[0]?.attrs?.start).toBe(4);
    const withoutStart = blocksToDoc([{ id: "l2", type: "list", style: "ordered", items: [{ spans: [{ text: "x" }] }] }]);
    expect(withoutStart.content?.[0]?.attrs?.start).toBe(1);
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
    expect(docToBlocks(doc)).toEqual([{ id: "l", type: "list", style: "bullet", items: [{ spans: [{ text: "a" }] }] }]);
  });

  it("reads a listMarker node's color attr back into markerColor, per item", () => {
    const doc: TiptapDocument = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          attrs: { blockId: "l" },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "listMarker", attrs: { color: "red" } }, { type: "text", text: "нэг" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "listMarker", attrs: { color: null } }, { type: "text", text: "хоёр" }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      {
        id: "l",
        type: "list",
        style: "ordered",
        items: [{ spans: [{ text: "нэг" }], markerColor: "red" }, { spans: [{ text: "хоёр" }] }],
      },
    ]);
  });

  it("reads an orderedList's start attr back into startsAt, only when it isn't the default 1", () => {
    const listNode = (start: number) => ({
      type: "orderedList" as const,
      attrs: { blockId: "l", start },
      content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] }],
    });
    expect(docToBlocks({ type: "doc", content: [listNode(3)] })[0]).toHaveProperty("startsAt", 3);
    expect(docToBlocks({ type: "doc", content: [listNode(1)] })[0]).not.toHaveProperty("startsAt");
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

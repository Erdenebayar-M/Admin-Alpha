import { describe, expect, it } from "vitest";
import {
  EXCERPT_MAX,
  articleToForm,
  excerptFromBody,
  formsEqual,
  isSlugLocked,
  toCreatePayload,
  toSavePayload,
  type ArticleFormState,
} from "./article-form";
import type { Article } from "./types";

const form: ArticleFormState = {
  title: "  Зөв бичих  ",
  slug: "zov-bichikh",
  category: "ORTHOGRAPHY",
  excerpt: "",
  thumbnail: null,
  body: [],
};

const article: Article = {
  id: "a1",
  title: "Гарчиг",
  slug: "garchig",
  category: "READING",
  status: "DRAFT",
  is_featured: false,
  published_at: null,
  updated_at: "2026-09-21T00:00:00Z",
  created_at: "2026-09-20T00:00:00Z",
  excerpt: null,
  body: [],
  thumbnail_url: null,
  thumbnail_alt: null,
  thumbnail_width: null,
  thumbnail_height: null,
  reading_time_minutes: 1,
  version: 3,
  was_published: false,
};

describe("toCreatePayload", () => {
  it("trims the title and leaves out an empty excerpt", () => {
    expect(toCreatePayload(form)).toEqual({
      title: "Зөв бичих",
      slug: "zov-bichikh",
      category: "ORTHOGRAPHY",
      body: [],
    });
  });
});

describe("toSavePayload", () => {
  it("carries the version, the excerpt and the thumbnail (null when detached)", () => {
    const thumbnail = { url: "https://cdn.example.com/t.jpg", alt: "Ном", width: 800, height: 600 };
    expect(toSavePayload({ ...form, excerpt: " Товч ", thumbnail }, 3)).toEqual({
      title: "Зөв бичих",
      slug: "zov-bichikh",
      category: "ORTHOGRAPHY",
      excerpt: "Товч",
      body: [],
      thumbnail,
      version: 3,
    });
    expect(toSavePayload(form, 4).thumbnail).toBeNull();
  });
});

describe("articleToForm", () => {
  it("rebuilds the thumbnail from the flat thumbnail_* columns", () => {
    expect(
      articleToForm({
        ...article,
        excerpt: "Товч",
        thumbnail_url: "https://cdn.example.com/t.jpg",
        thumbnail_alt: "Ном",
        thumbnail_width: 800,
        thumbnail_height: 600,
      }),
    ).toEqual({
      title: "Гарчиг",
      slug: "garchig",
      category: "READING",
      excerpt: "Товч",
      thumbnail: { url: "https://cdn.example.com/t.jpg", alt: "Ном", width: 800, height: 600 },
      body: [],
    });
  });

  it("has no thumbnail and an empty excerpt when the Article has none", () => {
    expect(articleToForm(article)).toMatchObject({ excerpt: "", thumbnail: null });
  });
});

describe("isSlugLocked", () => {
  it("locks the slug once the Article has ever been Published", () => {
    expect(isSlugLocked(undefined)).toBe(false);
    expect(isSlugLocked(article)).toBe(false);
    expect(isSlugLocked({ ...article, status: "PUBLISHED" })).toBe(true);
    expect(isSlugLocked({ ...article, was_published: true })).toBe(true);
  });
});

describe("excerptFromBody", () => {
  it("copies the first paragraph's text, skipping other Blocks before it", () => {
    expect(
      excerptFromBody([
        { id: "h", type: "heading", level: 2, text: "Гарчиг" },
        { id: "p1", type: "paragraph", content: [{ text: "Эхний " }, { text: "догол", bold: true }, { text: " мөр." }] },
        { id: "p2", type: "paragraph", content: [{ text: "Хоёр дахь" }] },
      ]),
    ).toBe("Эхний догол мөр.");
  });

  it("caps the text at the excerpt limit", () => {
    expect(excerptFromBody([{ id: "p", type: "paragraph", content: [{ text: "а".repeat(EXCERPT_MAX + 20) }] }])).toHaveLength(
      EXCERPT_MAX,
    );
  });

  it("is null when there's no paragraph", () => {
    expect(excerptFromBody([{ id: "d", type: "divider" }])).toBeNull();
  });
});

describe("formsEqual", () => {
  it("ignores key order, which jsonb doesn't preserve", () => {
    const fromServer = JSON.parse('{"id":"h","text":"Гарчиг","type":"heading","level":2}');
    const fromCanvas = { id: "h", type: "heading" as const, level: 2 as const, text: "Гарчиг" };
    expect(formsEqual({ ...form, body: [fromServer] }, { ...form, body: [fromCanvas] })).toBe(true);
  });

  it("still sees a real change", () => {
    expect(formsEqual(form, { ...form, body: [{ id: "d", type: "divider" }] })).toBe(false);
    expect(formsEqual(form, { ...form, title: "x" })).toBe(false);
  });
});

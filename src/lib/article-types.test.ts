import { describe, expect, it } from "vitest";
import { getArticlePublishIssues, isAllowedHref, isColorValue, isCustomColor, isHttpUrl, isPaletteColor, parseVideoUrl } from "./article-types";

describe("getArticlePublishIssues", () => {
  it("reports every missing field for a blank Article", () => {
    expect(
      getArticlePublishIssues({ title: "", slug: "", excerpt: null, thumbnail_url: null, body: [] }),
    ).toEqual(["title", "slug", "excerpt", "thumbnail", "body"]);
  });

  it("is empty once every required field is present", () => {
    expect(
      getArticlePublishIssues({
        title: "Title",
        slug: "title",
        excerpt: "Excerpt",
        thumbnail_url: "https://example.com/thumb.jpg",
        body: [{ id: "1", type: "divider" }],
      }),
    ).toEqual([]);
  });
});

describe("isAllowedHref", () => {
  it.each(["https://a.mn", "http://a.mn", "mailto:a@b.mn", "/articles/x", "/"])("allows %s", (href) => {
    expect(isAllowedHref(href)).toBe(true);
  });

  it.each(["javascript:alert(1)", "ftp://a.mn", "//evil.example", "/\\evil.example", "articles/x", ""])(
    "rejects %s",
    (href) => {
      expect(isAllowedHref(href)).toBe(false);
    },
  );
});

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", { provider: "youtube", video_id: "dQw4w9WgXcQ" }],
    ["https://youtu.be/dQw4w9WgXcQ", { provider: "youtube", video_id: "dQw4w9WgXcQ" }],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", { provider: "youtube", video_id: "dQw4w9WgXcQ" }],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", { provider: "youtube", video_id: "dQw4w9WgXcQ" }],
    ["https://vimeo.com/76979871", { provider: "vimeo", video_id: "76979871" }],
    ["https://player.vimeo.com/video/76979871", { provider: "vimeo", video_id: "76979871" }],
    ["https://vimeo.com/album/2222/video/1111", { provider: "vimeo", video_id: "1111" }],
    ["https://vimeo.com/channels/staffpicks/76979871", { provider: "vimeo", video_id: "76979871" }],
  ])("parses %s", (url, expected) => {
    expect(parseVideoUrl(url)).toEqual(expected);
  });

  it.each(["https://vimeo.com/not-a-video", "https://example.com/watch?v=x", "not a url", ""])(
    "rejects %s",
    (url) => {
      expect(parseVideoUrl(url)).toBeNull();
    },
  );
});

describe("isPaletteColor", () => {
  it.each(["brand-blue", "brand-indigo", "brand-green", "brand-navy", "brand-violet", "gray", "brown", "orange", "yellow", "purple", "pink", "red"])(
    "accepts %s",
    (name) => {
      expect(isPaletteColor(name)).toBe(true);
    },
  );

  it.each(["blue", "Red", "brand-Blue", "", "#2f5be4"])("rejects %s", (name) => {
    expect(isPaletteColor(name)).toBe(false);
  });
});

describe("isCustomColor", () => {
  it.each(["#2f5be4", "#000000", "#ffffff", "#a1b2c3"])("accepts %s", (hex) => {
    expect(isCustomColor(hex)).toBe(true);
  });

  it.each(["#fff", "#FFFFFF", "rgb(0,0,0)", "red ", "2f5be4", "#gggggg"])("rejects %s", (hex) => {
    expect(isCustomColor(hex)).toBe(false);
  });
});

describe("isColorValue", () => {
  it.each(["red", "#2f5be4"])("accepts %s", (value) => {
    expect(isColorValue(value)).toBe(true);
  });

  it.each([undefined, null, 1, "#FFFFFF", "not-a-colour"])("rejects %s", (value) => {
    expect(isColorValue(value)).toBe(false);
  });
});

describe("isHttpUrl", () => {
  it.each(["https://a.mn", "http://a.mn/x?y=1"])("allows %s", (url) => {
    expect(isHttpUrl(url)).toBe(true);
  });

  it.each(["mailto:a@b.mn", "ftp://a.mn", "/articles/x", "not a url", ""])("rejects %s", (url) => {
    expect(isHttpUrl(url)).toBe(false);
  });
});

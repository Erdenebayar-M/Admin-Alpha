import { describe, expect, it } from "vitest";
import { getArticlePublishIssues, isAllowedHref } from "./article-types";

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

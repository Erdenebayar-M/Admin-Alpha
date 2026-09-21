import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { articleBodyErrors, articleFieldErrors, isVersionConflict } from "./article-errors";
import type { ArticleBlock } from "./article-types";

describe("articleFieldErrors", () => {
  it("attaches VALIDATION_ERROR details to the metadata field they concern", () => {
    const err = new ApiError("Invalid body", {
      status: 400,
      code: "VALIDATION_ERROR",
      details: {
        title: ["String must contain at least 1 character(s)"],
        slug: ["Slug is already in use", "second message"],
        thumbnail: ["url must be an allowed asset url"],
      },
    });
    expect(articleFieldErrors(err)).toEqual({
      title: "String must contain at least 1 character(s)",
      slug: "Slug is already in use",
      thumbnail: "url must be an allowed asset url",
    });
  });

  it("maps a 422 slug-lock refusal onto the slug field", () => {
    const err = new ApiError("Slug cannot be changed once an Article has been published", {
      status: 422,
      code: "UNPROCESSABLE",
      details: { slug: ["Slug cannot be changed after publishing"] },
    });
    expect(articleFieldErrors(err)).toEqual({ slug: "Slug cannot be changed after publishing" });
  });

  it("flags each field a Published Article's save would leave missing (422 details.missing)", () => {
    const err = new ApiError("Article is missing required fields to publish", {
      status: 422,
      code: "UNPROCESSABLE",
      details: { missing: ["excerpt", "thumbnail", "body"] },
    });
    expect(articleFieldErrors(err)).toEqual({
      excerpt: "Нийтлэгдсэн нийтлэлд заавал шаардлагатай",
      thumbnail: "Нийтлэгдсэн нийтлэлд заавал шаардлагатай",
    });
  });

  it("ignores Body errors and anything that isn't a field-keyed envelope", () => {
    const bodyOnly = new ApiError("Invalid body", {
      status: 400,
      code: "VALIDATION_ERROR",
      details: { body: ["Block 3: url must be an http(s) link"] },
    });
    expect(articleFieldErrors(bodyOnly)).toEqual({});
    expect(articleFieldErrors(new Error("Network Error"))).toEqual({});
    expect(articleFieldErrors(new ApiError("x", { status: 400, details: "nope" }))).toEqual({});
  });
});

describe("isVersionConflict", () => {
  it("is true only for a 409", () => {
    expect(isVersionConflict(new ApiError("stale", { status: 409, code: "CONFLICT" }))).toBe(true);
    expect(isVersionConflict(new ApiError("bad", { status: 400 }))).toBe(false);
    expect(isVersionConflict(new Error("boom"))).toBe(false);
  });
});

describe("articleBodyErrors", () => {
  const sent: ArticleBlock[] = [
    { id: "p1", type: "paragraph", content: [{ text: "a" }] },
    { id: "k1", type: "link_card", url: "ftp://x", title: "x" },
  ];
  const validation = (body: string[]) =>
    new ApiError("Invalid body", { status: 400, code: "VALIDATION_ERROR", details: { body } });

  it("resolves 'Block <position>: <message>' to the id of the Block that was sent at that position", () => {
    expect(articleBodyErrors(validation(["Block 1: url must be an http(s) link"]), sent)).toEqual({
      blockErrors: { k1: "url must be an http(s) link" },
      unresolved: [],
    });
  });

  it("keeps the first message per Block", () => {
    expect(articleBodyErrors(validation(["Block 0: first", "Block 0: second"]), sent).blockErrors).toEqual({ p1: "first" });
  });

  it("leaves messages it can't place — unknown position, out of range, no position — for the banner", () => {
    expect(
      articleBodyErrors(validation(["Block ?: Unknown block type", "Block 7: nope", "Body cannot have more than 200 Blocks"]), sent),
    ).toEqual({
      blockErrors: {},
      unresolved: ["Block ?: Unknown block type", "Block 7: nope", "Body cannot have more than 200 Blocks"],
    });
  });

  it("reports a Published save's missing Body as a banner message", () => {
    const err = new ApiError("Not publishable", { status: 422, details: { missing: ["body"] } });
    expect(articleBodyErrors(err, [])).toEqual({ blockErrors: {}, unresolved: ["Агуулга: дор хаяж нэг блок шаардлагатай"] });
  });

  it("is empty for anything that isn't an ApiError with details", () => {
    expect(articleBodyErrors(new Error("x"), sent)).toEqual({ blockErrors: {}, unresolved: [] });
  });
});

import { describe, expect, it } from "vitest";
import { slugify } from "./article-slug";
import { SLUG_RE } from "./article-types";

describe("slugify", () => {
  it("transliterates a Mongolian Cyrillic title into a hyphenated Latin slug", () => {
    expect(slugify("Зөв бичих дүрэм")).toBe("zov-bichikh-durem");
  });

  it("collapses punctuation and spacing so the result always matches SLUG_RE", () => {
    const slug = slugify("  «Шинэ» үг — 2026 он!! Café ");
    expect(slug).toBe("shine-ug-2026-on-cafe");
    expect(SLUG_RE.test(slug)).toBe(true);
  });

  it("returns an empty string when nothing is transliterable", () => {
    expect(slugify("!!! ???")).toBe("");
  });
});

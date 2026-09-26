import { describe, expect, it } from "vitest";
import type { ArticleBlock } from "@/lib/article-types";
import { readingLayoutClass } from "./site-reading-layout";

describe("readingLayoutClass", () => {
  it.each<ArticleBlock["type"]>(["heading", "quote"])("hangs %s left of the reading column", (type) => {
    expect(readingLayoutClass(type)).toContain("pl-[60px]");
  });

  it.each<ArticleBlock["type"]>(["paragraph", "list", "image", "video", "link_card", "divider", "callout"])(
    "keeps %s on the 775px column",
    (type) => {
      expect(readingLayoutClass(type)).toContain("max-w-[775px]");
    },
  );
});

import type { ArticleBlock } from "@/lib/article-types";

// Reading layout of the site's article card (Alpha issue #115, Figma frame
// 1422:6961), mirrored from `Alpha/web/components/article/ArticleBody.tsx` — a
// site rule authors can't change, unrelated to Text alignment. At the 1440px
// frame the card is ≈1000px, the reading column ≈775px centered in it, and
// subheadings/Quotes start ≈60px in from the card's inner edge, hanging left of
// the column while sharing its right edge.
//
// Pure (no next/font) so it is unit-testable; re-exported by `site-look.ts`.
// The site breaks at the `lg` viewport; the Preview sits in a pane narrower than
// the viewport, so the same breakpoint is a container query on the card
// (`@container`) — 1024px viewport minus the card's padding ≈ 944px.

/** Outer card: width cap plus the container the hang breakpoint measures. */
export const SITE_CARD_CLASS = "@container mx-auto w-full max-w-[1000px] rounded-3xl bg-white p-6 sm:p-10";

const READING_COLUMN_CLASS = "mx-auto w-full max-w-[775px]";
const HANGING_CLASS = "w-full @[944px]:pl-[60px] @[944px]:pr-[calc((100%-775px)/2)]";

/** Wrapper class that places a Block of this kind on the reading layout. */
export function readingLayoutClass(blockType: ArticleBlock["type"]): string {
  return blockType === "heading" || blockType === "quote" ? HANGING_CLASS : READING_COLUMN_CLASS;
}

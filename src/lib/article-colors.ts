import { isCustomColor, isPaletteColor, type ArticleBlock, type ColorValue, type InlineSpan, type PaletteColor } from "./article-types";

/**
 * Colour menu support: CSS resolution for a stored `ColorValue`, Mongolian
 * Palette labels, and the "used in this article" scan. Mirrors
 * `Alpha/web/components/article/colors.ts` for the CSS half — Palette names
 * resolve to the `--color-palette-*` tokens mirrored into
 * `src/app/globals.css` from `Alpha/web/app/globals.css`.
 */

/** The CSS value for a Colour used as a text colour (span `color`, heading `color`). */
export function colorCss(color: ColorValue): string {
  return isPaletteColor(color) ? `var(--color-palette-${color})` : color;
}

/**
 * The CSS value for a Colour used as a tinted background (span `highlight`,
 * Block `background`). Palette names resolve to a precomputed lighter token;
 * a custom hex has no precomputed tint, so it's lightened at render time with
 * the same ~16% mix the precomputed tokens approximate.
 */
export function tintCss(color: ColorValue): string {
  return isPaletteColor(color) ? `var(--color-palette-${color}-tint)` : `color-mix(in srgb, ${color} 16%, white)`;
}

// The site's own page background and body-text ink (hardcoded, same values as
// `ArticlePreview.tsx`'s BODY_TEXT_CLASS) — what the readability warning
// checks a custom colour against.
export const SITE_PAGE_BACKGROUND = "#ffffff";
export const SITE_BODY_TEXT = "#101828";

export const PALETTE_LABELS: Record<PaletteColor, string> = {
  "brand-blue": "Хөх",
  "brand-indigo": "Индиго",
  "brand-green": "Ногоон",
  "brand-navy": "Бараан хөх",
  "brand-violet": "Ягаан хөх",
  gray: "Саарал",
  brown: "Хүрэн",
  orange: "Улбар шар",
  yellow: "Шар",
  purple: "Нил ягаан",
  pink: "Час ягаан",
  red: "Улаан",
};

function collectSpanColors(spans: InlineSpan[], out: Set<string>): void {
  for (const span of spans) {
    if (span.color && isCustomColor(span.color)) out.add(span.color);
    if (span.highlight && isCustomColor(span.highlight)) out.add(span.highlight);
  }
}

/** Custom (non-Palette) hex colours already used anywhere in the Body, in first-seen order — the colour menu's "used in this article" row. */
export function usedCustomColors(blocks: ArticleBlock[]): string[] {
  const seen = new Set<string>();
  for (const block of blocks) {
    if ("background" in block && block.background && isCustomColor(block.background)) seen.add(block.background);
    switch (block.type) {
      case "paragraph":
      case "quote":
      case "callout":
        collectSpanColors(block.content, seen);
        break;
      case "heading":
        if (block.color && isCustomColor(block.color)) seen.add(block.color);
        break;
      case "list":
        for (const item of block.items) collectSpanColors(item, seen);
        break;
      default:
        break;
    }
  }
  return Array.from(seen);
}

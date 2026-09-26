import { Nunito } from "next/font/google";
import type { CSSProperties } from "react";

export { SITE_CARD_CLASS, readingLayoutClass } from "./site-reading-layout";

// The one place the admin mirrors the site's look (font, colour tokens,
// per-Block-kind styles). The article Preview renders from here; a site
// retune is a single-place change.

// Same font + subsets as `Alpha/web/app/layout.tsx` — full Cyrillic Extended
// coverage so Өө/Үү render correctly. Loaded only for the surfaces meant to
// look like the site, not the admin app's own `layout.tsx`.
const nunito = Nunito({
  variable: "--font-nunito-preview",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

/** Class that defines the font variable; put it on the site-look surface. */
export const SITE_FONT_CLASS = nunito.variable;

export const SITE_FONT_STYLE: CSSProperties = { fontFamily: "var(--font-nunito-preview), sans-serif" };

import { SITE_COLOR_VARS } from "./site-tokens";

export { SITE_CLASS, SITE_COLOR_VARS, SITE_SURFACE_HEX } from "./site-tokens";

/** Inline style for the site-look surface: font + colour variables. */
export const SITE_SURFACE_STYLE: CSSProperties = { ...SITE_FONT_STYLE, ...SITE_COLOR_VARS };

import { Nunito } from "next/font/google";
import type { CSSProperties } from "react";

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

// Hex values copied from `Alpha/web/app/globals.css`'s `@theme` tokens — this
// repo can't import that file or its Tailwind config, so they are mirrored by
// hand. Each entry names the site token it copies; update them together when
// the site retunes.
const SITE_COLORS = {
  ink: "#101828", // color-text-nav-strong
  heading: "#24428f", // color-text-navy
  muted: "#667085", // color-text-nav
  link: "#2f5be4", // color-brand-blue
  border: "#e4e7ec", // color-border-card
  borderSoft: "#e8eef7", // color-border-soft
  surface: "#f7f9fc", // color-surface-page
  title: "#0f1f4d", // color-article-title
} as const;

/** CSS custom properties for the tokens above; set on the site-look surface. */
export const SITE_COLOR_VARS = {
  "--site-ink": SITE_COLORS.ink,
  "--site-heading": SITE_COLORS.heading,
  "--site-muted": SITE_COLORS.muted,
  "--site-link": SITE_COLORS.link,
  "--site-border": SITE_COLORS.border,
  "--site-border-soft": SITE_COLORS.borderSoft,
  "--site-surface": SITE_COLORS.surface,
  "--site-title": SITE_COLORS.title,
} as CSSProperties;

/** Inline style for the site-look surface: font + colour variables. */
export const SITE_SURFACE_STYLE: CSSProperties = { ...SITE_FONT_STYLE, ...SITE_COLOR_VARS };

/** Fallback for a callout with no background Colour. */
export const SITE_SURFACE_HEX = SITE_COLORS.surface;

// Full literal class strings (Tailwind scans source text; no interpolation).
export const SITE_CLASS = {
  body: "text-base leading-relaxed text-[color:var(--site-ink)]",
  heading: "font-extrabold text-[color:var(--site-heading)]",
  muted: "text-[color:var(--site-muted)]",
  link: "text-[color:var(--site-link)] underline underline-offset-2",
  quote: "border-l-4 border-[color:var(--site-border)] pl-4 italic",
  callout: "rounded-2xl border border-[color:var(--site-border-soft)] px-5 py-4",
  divider: "border-[color:var(--site-border)]",
  linkCard: "flex gap-4 rounded-2xl border border-[color:var(--site-border)] p-4 transition-colors hover:bg-[color:var(--site-surface)]",
  linkCardPlaceholder: "flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-[color:var(--site-surface)]",
  linkCardTitle: "font-bold text-[color:var(--site-title)]",
} as const;

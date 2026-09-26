import type { CSSProperties } from "react";

// Pure (no next/font) half of the site look, so canvas node views and tests can import it; re-exported by `site-look.ts`.

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

/** Fallback for a callout with no background Colour. */
export const SITE_SURFACE_HEX = SITE_COLORS.surface;

// Full literal class strings (Tailwind scans source text; no interpolation).
export const SITE_CLASS = {
  body: "text-base leading-relaxed text-[color:var(--site-ink)]",
  heading: "font-extrabold text-[color:var(--site-heading)]",
  muted: "text-[color:var(--site-muted)]",
  link: "text-[color:var(--site-link)] underline underline-offset-2",
  // Site pull-quote: large italic navy, no left border; the “ ” are drawn in the Preview.
  quote: "text-2xl italic leading-snug text-[color:var(--site-heading)]",
  // Article title at the top of the card (site: text-3xl font-extrabold text-text-navy).
  title: "text-center text-3xl font-extrabold text-[color:var(--site-heading)]",
  callout: "rounded-2xl border border-[color:var(--site-border-soft)] px-5 py-4",
  divider: "border-[color:var(--site-border)]",
  linkCard: "flex gap-4 rounded-2xl border border-[color:var(--site-border)] p-4 transition-colors hover:bg-[color:var(--site-surface)]",
  linkCardPlaceholder: "flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-[color:var(--site-surface)]",
  linkCardTitle: "font-bold text-[color:var(--site-title)]",
} as const;

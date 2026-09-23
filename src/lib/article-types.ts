/**
 * Local mirror of `Alpha/shared/src/validators/article.ts`. This repo
 * (Admin-Alpha) cannot import `@app/shared` — it's a separate repo/deployment
 * from `Alpha/backend` — so the Article contract's shapes are copied here by
 * hand. Keep this file in sync whenever the upstream validator changes; the
 * backend's own validation is still the final authority, this module only
 * exists so the admin UI can build forms and pre-flight checks against the
 * same shapes.
 */

// ── Category ──────────────────────────────────────────────────────────────

export const ARTICLE_CATEGORIES = ["READING", "ORTHOGRAPHY", "SPELLING"] as const;
export type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number];

// ── Status ────────────────────────────────────────────────────────────────

export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type ArticleStatusValue = (typeof ARTICLE_STATUSES)[number];

// ── Slug ──────────────────────────────────────────────────────────────────

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ── Inline href allowlist ────────────────────────────────────────────────
// https:, http:, mailto:, or a same-origin path starting with "/" — the
// `inlineHrefSchema` rule. A path is resolved against a placeholder origin
// and checked that it stays on it, so "//host" or "/\host" (which browsers
// treat as protocol-relative) are rejected despite starting with "/".

export function isAllowedHref(href: string): boolean {
  if (href.startsWith("https:") || href.startsWith("http:") || href.startsWith("mailto:")) return true;
  if (!href.startsWith("/")) return false;
  try {
    const placeholder = "https://placeholder.invalid";
    return new URL(href, placeholder).origin === placeholder;
  } catch {
    return false;
  }
}

// ── Colours (issue #108 / Admin-Alpha#9) ────────────────────────────────────
// A Colour is either a Palette name — stored by name so the site can retune
// the shade later, per Alpha's ADR 0003 — or a custom hex the author picked
// freely, stored exactly as given. Lowercase-only hex keeps stored values
// canonical (`#FFFFFF`/`#fff` are rejected, not normalized).

export const PALETTE_COLORS = [
  "brand-blue",
  "brand-indigo",
  "brand-green",
  "brand-navy",
  "brand-violet",
  "gray",
  "brown",
  "orange",
  "yellow",
  "purple",
  "pink",
  "red",
] as const;
export type PaletteColor = (typeof PALETTE_COLORS)[number];

const PALETTE_COLOR_SET = new Set<string>(PALETTE_COLORS);

export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

/** A Palette name or a custom `#rrggbb` hex string. */
export type ColorValue = PaletteColor | string;

export function isPaletteColor(value: string): value is PaletteColor {
  return PALETTE_COLOR_SET.has(value);
}

export function isCustomColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

export function isColorValue(value: unknown): value is ColorValue {
  return typeof value === "string" && (isPaletteColor(value) || isCustomColor(value));
}

// ── Blocks ────────────────────────────────────────────────────────────────

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
  /** Text colour of the words. Mutually exclusive with `highlight`, and never set alongside `href`. */
  color?: ColorValue;
  /** Background behind the words. Mutually exclusive with `color`, and never set alongside `href`. */
  highlight?: ColorValue;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  content: InlineSpan[];
  background?: ColorValue;
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
  /** Text colour of the whole subheading. */
  color?: ColorValue;
  background?: ColorValue;
}

// One level only: an item is an array of inline spans, never another list.
export const LIST_STYLES = ["bullet", "ordered"] as const;
export type ListStyle = (typeof LIST_STYLES)[number];

export interface ListBlock {
  id: string;
  type: "list";
  style: ListStyle;
  items: InlineSpan[][];
  background?: ColorValue;
}

export interface QuoteBlock {
  id: string;
  type: "quote";
  content: InlineSpan[];
  attribution?: string;
  background?: ColorValue;
}

export interface CalloutBlock {
  id: string;
  type: "callout";
  content: InlineSpan[];
  background?: ColorValue;
}

export interface DividerBlock {
  id: string;
  type: "divider";
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export const VIDEO_PROVIDERS = ["youtube", "vimeo"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

// Only provider + video_id are ever stored or returned by the backend —
// never the pasted url — so a video Block can't carry an arbitrary embed
// target.
export interface VideoBlock {
  id: string;
  type: "video";
  provider: VideoProvider;
  video_id: string;
}

export interface ParsedVideoLink {
  provider: VideoProvider;
  video_id: string;
}

// Mirrors the backend's `parseVideoUrl` exactly (same host/id rules), so a
// pasted link can be parsed and previewed client-side before it's ever sent —
// the server re-parses the same url itself, this is UX only.
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,}$/;
const VIMEO_ID_RE = /^\d+$/;

/** Parse a pasted YouTube or Vimeo url into `{ provider, video_id }`, or `null` for any other host. */
export function parseVideoUrl(raw: string): ParsedVideoLink | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0] ?? "";
      return YOUTUBE_ID_RE.test(id) ? { provider: "youtube", video_id: id } : null;
    }
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID_RE.test(id) ? { provider: "youtube", video_id: id } : null;
    }
    const embedMatch = /^\/embed\/([^/?]+)/.exec(url.pathname);
    if (embedMatch && YOUTUBE_ID_RE.test(embedMatch[1])) {
      return { provider: "youtube", video_id: embedMatch[1] };
    }
    const shortsMatch = /^\/shorts\/([^/?]+)/.exec(url.pathname);
    if (shortsMatch && YOUTUBE_ID_RE.test(shortsMatch[1])) {
      return { provider: "youtube", video_id: shortsMatch[1] };
    }
    return null;
  }

  if (VIMEO_HOSTS.has(host)) {
    const segments = url.pathname.split("/").filter(Boolean);
    // `/album/2222/video/1111` and `player.vimeo.com/video/1111` both name the
    // actual video id right after a literal "video" segment — checked first,
    // since the *first* numeric segment in an album/showcase link is the
    // album id, not the video.
    const videoIdx = segments.indexOf("video");
    if (videoIdx !== -1 && VIMEO_ID_RE.test(segments[videoIdx + 1] ?? "")) {
      return { provider: "vimeo", video_id: segments[videoIdx + 1] };
    }
    // Otherwise (`/76979871`, `/channels/staffpicks/76979871`) the video id is
    // the last numeric segment, not the first.
    const numeric = segments.filter((segment) => VIMEO_ID_RE.test(segment));
    const id = numeric[numeric.length - 1];
    return id ? { provider: "vimeo", video_id: id } : null;
  }

  return null;
}

// Mirrors `httpUrlSchema` — a link card's url must be an http(s) link (the
// server never fetches it, so this is display validation only).
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export interface LinkCardImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

// The server never fetches this url — title/description/image are typed in
// by hand, per ADR 0001.
export interface LinkCardBlock {
  id: string;
  type: "link_card";
  url: string;
  title: string;
  description?: string;
  image?: LinkCardImage;
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | ImageBlock
  | VideoBlock
  | LinkCardBlock;

export type ArticleBody = ArticleBlock[];

// ── Thumbnail ─────────────────────────────────────────────────────────────

export interface ArticleThumbnail {
  url: string;
  alt: string;
  width: number;
  height: number;
}

// ── Publish readiness ────────────────────────────────────────────────────
// Single source of truth for what "ready to publish" means: title, a valid
// slug, excerpt, Thumbnail and at least one Block. Mirrors the backend's own
// check so the admin editor can pre-flight the same rule before the Publish
// button is even clickable — the server re-runs this itself on
// `POST /:id/publish`.

export const ARTICLE_PUBLISH_FIELDS = ["title", "slug", "excerpt", "thumbnail", "body"] as const;
export type ArticlePublishField = (typeof ARTICLE_PUBLISH_FIELDS)[number];

export interface ArticlePublishCheckInput {
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  body: unknown;
}

/** Missing fields blocking Publish, in a fixed order — empty when ready. */
export function getArticlePublishIssues(article: ArticlePublishCheckInput): ArticlePublishField[] {
  const missing: ArticlePublishField[] = [];
  if (!article.title.trim()) missing.push("title");
  if (!SLUG_RE.test(article.slug)) missing.push("slug");
  if (!article.excerpt || !article.excerpt.trim()) missing.push("excerpt");
  if (!article.thumbnail_url) missing.push("thumbnail");
  if (!Array.isArray(article.body) || article.body.length === 0) missing.push("body");
  return missing;
}

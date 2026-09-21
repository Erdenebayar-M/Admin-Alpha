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

// ── Blocks ────────────────────────────────────────────────────────────────

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  content: InlineSpan[];
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
}

// One level only: an item is an array of inline spans, never another list.
export const LIST_STYLES = ["bullet", "ordered"] as const;
export type ListStyle = (typeof LIST_STYLES)[number];

export interface ListBlock {
  id: string;
  type: "list";
  style: ListStyle;
  items: InlineSpan[][];
}

export interface QuoteBlock {
  id: string;
  type: "quote";
  content: InlineSpan[];
  attribution?: string;
}

export interface CalloutBlock {
  id: string;
  type: "callout";
  content: InlineSpan[];
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

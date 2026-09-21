import type { CreateArticlePayload, SaveArticlePayload } from "./api";
import type { ArticleBlock, ArticleCategoryValue, ArticleThumbnail } from "./article-types";
import type { Article } from "./types";

/** Editable Article fields as the editor holds them — strings never null, the Thumbnail as one object. */
export interface ArticleFormState {
  title: string;
  slug: string;
  category: ArticleCategoryValue;
  excerpt: string;
  thumbnail: ArticleThumbnail | null;
  body: ArticleBlock[];
}

export const EXCERPT_MAX = 500;

export const EMPTY_ARTICLE_FORM: ArticleFormState = {
  title: "",
  slug: "",
  category: "READING",
  excerpt: "",
  thumbnail: null,
  body: [],
};

export function articleToForm(article: Article): ArticleFormState {
  const { thumbnail_url: url, thumbnail_alt: alt, thumbnail_width: width, thumbnail_height: height } = article;
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    excerpt: article.excerpt ?? "",
    thumbnail: url && alt && width && height ? { url, alt, width, height } : null,
    body: article.body,
  };
}

export function toCreatePayload(form: ArticleFormState): CreateArticlePayload {
  const excerpt = form.excerpt.trim();
  return {
    title: form.title.trim(),
    slug: form.slug,
    category: form.category,
    ...(excerpt ? { excerpt } : {}),
    body: form.body,
  };
}

/** PUT replaces the whole Article, so a missing excerpt clears it and `thumbnail: null` detaches it. */
export function toSavePayload(form: ArticleFormState, version: number): SaveArticlePayload {
  return { ...toCreatePayload(form), thumbnail: form.thumbnail, version };
}

/** A Published URL must never move: the slug is read-only once the Article has ever been Published. */
export function isSlugLocked(article: Pick<Article, "status" | "was_published"> | undefined): boolean {
  return !!article && (article.status === "PUBLISHED" || article.was_published);
}

/** The excerpt autofill: the first paragraph's plain text, capped at the excerpt limit — `null` when there's none. */
export function excerptFromBody(body: ArticleBlock[]): string | null {
  const first = body.find((b) => b.type === "paragraph");
  if (!first) return null;
  return first.content
    .map((s) => s.text)
    .join("")
    .trim()
    .slice(0, EXCERPT_MAX);
}

/** JSON with object keys sorted, so equal data serializes identically whatever order its keys arrived in. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}

/**
 * Dirty check. Compares by content, not key order: the server's jsonb Body
 * comes back with keys reordered, while the canvas rebuilds Blocks in its own
 * order — a plain `JSON.stringify` compare would flag an untouched Article.
 */
export function formsEqual(a: ArticleFormState, b: ArticleFormState): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

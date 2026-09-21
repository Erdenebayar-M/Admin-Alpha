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

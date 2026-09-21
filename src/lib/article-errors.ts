import { ApiError } from "./api-error";

export const ARTICLE_METADATA_FIELDS = ["title", "slug", "category", "excerpt", "thumbnail"] as const;
export type ArticleMetadataField = (typeof ARTICLE_METADATA_FIELDS)[number];
export type ArticleFieldErrors = Partial<Record<ArticleMetadataField, string>>;

export const MISSING_ON_PUBLISHED = "Нийтлэгдсэн нийтлэлд заавал шаардлагатай";

/**
 * Picks the settings-panel field errors out of a failed create/save. The
 * backend sends zod's `fieldErrors` (`{ field: string[] }`) as `details` for
 * both VALIDATION_ERROR and the 422 slug-lock refusal; the first message per
 * field is shown. Body errors are left to the caller's top-level banner.
 */
export function articleFieldErrors(err: unknown): ArticleFieldErrors {
  if (!(err instanceof ApiError) || !err.details || typeof err.details !== "object") return {};
  const details = err.details as Record<string, unknown>;
  const fields: ArticleFieldErrors = {};
  for (const field of ARTICLE_METADATA_FIELDS) {
    const messages = details[field];
    if (Array.isArray(messages) && typeof messages[0] === "string") fields[field] = messages[0];
  }
  // A save that would leave a Published Article unpublishable answers 422
  // with `{ missing: ArticlePublishField[] }` instead of per-field messages.
  const missing = details.missing;
  if (Array.isArray(missing)) {
    for (const field of ARTICLE_METADATA_FIELDS) {
      if (missing.includes(field) && !fields[field]) fields[field] = MISSING_ON_PUBLISHED;
    }
  }
  return fields;
}

/** PUT /articles/:id answers 409 when the sent `version` is stale — another save landed first. */
export function isVersionConflict(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409;
}

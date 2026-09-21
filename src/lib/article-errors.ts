import { ApiError } from "./api-error";
import type { ArticleBlock } from "./article-types";

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

export const MISSING_BODY = "Агуулга: дор хаяж нэг блок шаардлагатай";
const BLOCK_ERROR_RE = /^Block (\d+): (.+)$/;

export interface ArticleBodyErrors {
  /** First message per Block, keyed by the id of the Block sent at that position. */
  blockErrors: Record<string, string>;
  /** Body messages that couldn't be placed on a Block — shown in the top-level banner. */
  unresolved: string[];
}

/**
 * Body errors from a failed create/save. The backend names a failing Block
 * as `"Block <position>: <message>"` (0-based, into the array that was sent),
 * so `sent` — not the canvas's current state — is what the position resolves
 * against; the Block id then finds the node in the canvas even after edits.
 */
export function articleBodyErrors(err: unknown, sent: ArticleBlock[]): ArticleBodyErrors {
  const result: ArticleBodyErrors = { blockErrors: {}, unresolved: [] };
  if (!(err instanceof ApiError) || !err.details || typeof err.details !== "object") return result;
  const { body, missing } = err.details as Record<string, unknown>;
  for (const message of Array.isArray(body) ? body : []) {
    if (typeof message !== "string") continue;
    const match = BLOCK_ERROR_RE.exec(message);
    const block = match ? sent[Number(match[1])] : undefined;
    if (!match || !block) result.unresolved.push(message);
    else if (!(block.id in result.blockErrors)) result.blockErrors[block.id] = match[2];
  }
  if (Array.isArray(missing) && missing.includes("body")) result.unresolved.push(MISSING_BODY);
  return result;
}

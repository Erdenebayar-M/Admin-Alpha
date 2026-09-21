/**
 * Error thrown by every `lib/api.ts` client. Still an `Error` (so existing
 * `err.message` callers are unchanged), but keeps the HTTP status and the
 * backend envelope's `code`/`details` for callers that need to react to them
 * — e.g. a version conflict or field-keyed validation errors.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, init: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
  }
}

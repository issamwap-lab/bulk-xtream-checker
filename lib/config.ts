/** Max wait per provider API call (server-side). */
export const LINE_CHECK_TIMEOUT_MS = 8_000;

/** Client wait for /api/check-line (slightly above server timeout). */
export const CLIENT_CHECK_TIMEOUT_MS = LINE_CHECK_TIMEOUT_MS + 3_000;

/** How many lines are checked in parallel. */
export const CHECK_CONCURRENCY = 6;

/** Sentinel value for unlimited/lifetime accounts. */
export const LIFETIME_DAYS_SENTINEL = 9999;

/** Max lines allowed in the textarea. */
export const MAX_INPUT_LINES = 200;

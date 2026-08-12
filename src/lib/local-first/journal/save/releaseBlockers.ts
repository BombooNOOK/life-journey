/**
 * Known transitional gaps — not resolved in 4B-4L.
 * Do not document or code these as "fixed".
 */

/** Release blocker candidate: crash between Server 200 OK and durable outbox enqueue. */
export const SERVER_SUCCESS_TO_OUTBOX_GAP = "SERVER_SUCCESS_TO_OUTBOX_GAP" as const;

/**
 * When the app process dies after the Server transaction commits but before
 * `enqueueBeforeMirror` persists a row, the Journal entry exists on Server only.
 * Reconciliation / backfill design is a follow-up Phase — not solved here.
 */
export const SERVER_SUCCESS_TO_OUTBOX_GAP_DESCRIPTION =
  "Server save succeeded (200 OK + entry.id) but outbox enqueue not yet durable; kill may leave Server-only entry." as const;

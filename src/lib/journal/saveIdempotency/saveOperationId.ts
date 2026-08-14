/**
 * saveOperationId request contract (4B-4Y).
 *
 * Client-generated opaque stable id for one logical save attempt.
 * Distinct from JournalEntry.id and Local generation id.
 * Retry must reuse the same id; a new save must mint a new id.
 */

export type SaveOperationIdParse =
  | { ok: true; saveOperationId: string }
  | { ok: false; code: "MISSING" | "INVALID"; detail: string };

const MIN_LEN = 16;
const MAX_LEN = 64;
/** Crockford Base32 / ULID-safe + hyphen/underscore for opaque ids */
const PATTERN = /^[0-9A-Za-z_-]+$/;

/**
 * Parse optional saveOperationId from JSON body.
 * - absent / null / "" → MISSING (legacy-compatible when feature ON)
 * - present but invalid → INVALID (reject; never invent server-side id)
 */
export function parseSaveOperationIdFromBody(json: unknown): SaveOperationIdParse {
  if (typeof json !== "object" || json === null || !("saveOperationId" in json)) {
    return { ok: false, code: "MISSING", detail: "saveOperationId absent" };
  }
  const raw = (json as { saveOperationId: unknown }).saveOperationId;
  if (raw === null || raw === undefined) {
    return { ok: false, code: "MISSING", detail: "saveOperationId null" };
  }
  if (typeof raw !== "string") {
    return { ok: false, code: "INVALID", detail: "saveOperationId must be string" };
  }
  const id = raw.trim();
  if (!id) {
    return { ok: false, code: "MISSING", detail: "saveOperationId empty" };
  }
  if (id.length < MIN_LEN || id.length > MAX_LEN) {
    return {
      ok: false,
      code: "INVALID",
      detail: `saveOperationId length must be ${MIN_LEN}-${MAX_LEN}`,
    };
  }
  if (!PATTERN.test(id)) {
    return {
      ok: false,
      code: "INVALID",
      detail: "saveOperationId has illegal characters",
    };
  }
  return { ok: true, saveOperationId: id };
}

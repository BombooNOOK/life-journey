/**
 * Non-PII request fingerprint for save-operation idempotency conflict detection.
 * Never include raw content / photo bytes / secrets — hashes / identities only.
 */

export type JournalSaveRequestFingerprintInput = {
  /** SHA-256 (hex) of normalized content, computed by caller. */
  contentHash: string;
  /** Entry calendar date YYYY-MM-DD (Japan date key style). */
  entryDate: string;
  /**
   * Stable photo identity: "none" | content-address hash | blob pathname id.
   * Not the photo bytes themselves.
   */
  photoIdentity: string;
};

export function buildJournalSaveRequestFingerprint(
  input: JournalSaveRequestFingerprintInput,
): string {
  const contentHash = input.contentHash.trim().toLowerCase();
  const entryDate = input.entryDate.trim();
  const photoIdentity = input.photoIdentity.trim() || "none";
  return `v1|${contentHash}|${entryDate}|${photoIdentity}`;
}

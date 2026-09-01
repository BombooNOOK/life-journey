/**
 * Production journal save request fingerprint (4B-4Y).
 * Non-PII: hashes / enums / ids only — never raw body or photo bytes in JSO.
 */

import { sha256HexSync } from "@/lib/crypto/sha256HexSync";
import { buildJournalSaveRequestFingerprint } from "@/lib/journal/saveIdempotency/requestFingerprint";

export type ProductionJournalSaveFingerprintInput = {
  content: string;
  entryDate: string;
  profileId: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  includeInBook: boolean;
  /** "none" | sha256 hex of photo dataUrl when set | "remove" */
  photoIdentity: string;
};

export function sha256Hex(text: string): string {
  return sha256HexSync(text);
}

export function photoIdentityFromPatch(input: {
  kind: "set" | "remove" | "unchanged";
  dataUrl?: string;
}): string {
  if (input.kind === "remove") return "remove";
  if (input.kind === "set" && input.dataUrl) {
    return `photo:${sha256Hex(input.dataUrl)}`;
  }
  return "none";
}

/**
 * Deterministic fingerprint for idempotency conflict detection.
 * Extends v1 content|date|photo with profile + meta enums (still non-secret).
 */
export function buildProductionJournalSaveFingerprint(
  input: ProductionJournalSaveFingerprintInput,
): string {
  const contentHash = sha256Hex(input.content);
  const base = buildJournalSaveRequestFingerprint({
    contentHash,
    entryDate: input.entryDate,
    photoIdentity: input.photoIdentity,
  });
  const meta = [
    `profile:${input.profileId.trim()}`,
    `mood:${input.mood}`,
    `activity:${input.activity}`,
    `companion:${input.companionType}`,
    `theme:${input.designTheme}`,
    `font:${input.contentFontMode}`,
    `book:${input.includeInBook ? "1" : "0"}`,
  ].join("|");
  return `${base}|${meta}`;
}

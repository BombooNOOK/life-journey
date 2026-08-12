/**
 * Canonical JSON encoding for activation manifest checksum.
 * Key order is sorted recursively so serialization is stable.
 */

import type {
  LocalJournalActivationManifest,
  ManifestChecksumBody,
} from "@/lib/local-first/journal/activation/types";
import { sha256HexOfUtf8 } from "@/lib/local-first/journal/checksum";

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = sortValue(obj[key]);
  }
  return out;
}

/** Deterministic JSON string (sorted keys, no whitespace). */
export function canonicalJsonString(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function manifestBodyWithoutChecksum(
  manifest: LocalJournalActivationManifest | ManifestChecksumBody,
): ManifestChecksumBody {
  const {
    formatVersion,
    generation,
    activeDatabaseId,
    activeMediaRootId,
    previousDatabaseId,
    previousMediaRootId,
    activationState,
    schemaVersion,
    activatedAt,
  } = manifest;
  return {
    formatVersion,
    generation,
    activeDatabaseId,
    activeMediaRootId,
    previousDatabaseId,
    previousMediaRootId,
    activationState,
    schemaVersion,
    activatedAt,
  };
}

export async function computeManifestChecksum(
  body: ManifestChecksumBody | LocalJournalActivationManifest,
): Promise<string> {
  const without = manifestBodyWithoutChecksum(body);
  return sha256HexOfUtf8(canonicalJsonString(without));
}

export async function attachManifestChecksum(
  body: ManifestChecksumBody,
): Promise<LocalJournalActivationManifest> {
  const checksum = await computeManifestChecksum(body);
  return { ...body, checksum };
}

export async function verifyManifestChecksum(
  manifest: LocalJournalActivationManifest,
): Promise<boolean> {
  const expected = await computeManifestChecksum(manifest);
  return expected === manifest.checksum;
}

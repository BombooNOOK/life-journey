/**
 * Resolved Local Journal generation target (4B-4G).
 * Developer-only routing input. Not a Source-of-Truth switch.
 * Never carries secrets / passphrases / journal body.
 */

import {
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
} from "@/lib/local-first/journal/activation/types";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";

export type ResolvedLocalJournalGeneration = {
  generation: number;
  databaseId: string;
  mediaRootId: string;
  schemaVersion: number;
  manifestChecksum: string;
};

export type GenerationResolveDenyReason =
  | "no_activation"
  | "corrupt_manifest"
  | "missing_database"
  | "preflight_failed"
  | "checksum_mismatch"
  | "unknown_format"
  | "rejected_target"
  | "capacity_unknown"
  | "db_media_pair_mismatch"
  | "plaintext_forbidden"
  | "unsupported_generation";

export type GenerationResolveOutcome =
  | { ok: true; target: ResolvedLocalJournalGeneration }
  | { ok: false; reason: GenerationResolveDenyReason; detail: string };

/** Known valid (databaseId, mediaRootId) pairs for technical generations. */
export const ALLOWED_TECHNICAL_GENERATION_PAIRS: ReadonlyArray<{
  databaseId: string;
  mediaRootId: string;
  generation: number;
}> = [
  {
    databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    generation: TECHNICAL_CANDIDATE_GENERATION,
  },
];

export function isPlaintextProductionDatabaseId(databaseId: string): boolean {
  return databaseId === LOCAL_JOURNAL_DB_NAME;
}

export function assertDbMediaPairIntegrity(target: {
  databaseId: string;
  mediaRootId: string;
}): void {
  if (isPlaintextProductionDatabaseId(target.databaseId)) {
    throw new Error("plaintext_forbidden");
  }
  if (target.mediaRootId === LOCAL_JOURNAL_MEDIA_ROOT) {
    throw new Error("plaintext_media_forbidden");
  }
  const allowed = ALLOWED_TECHNICAL_GENERATION_PAIRS.some(
    (p) =>
      p.databaseId === target.databaseId && p.mediaRootId === target.mediaRootId,
  );
  if (!allowed) {
    throw new Error("db_media_pair_mismatch");
  }
}

export function mapManifestToResolvedGeneration(input: {
  generation: number;
  databaseId: string;
  mediaRootId: string;
  schemaVersion: number;
  manifestChecksum: string;
}): GenerationResolveOutcome {
  if (isPlaintextProductionDatabaseId(input.databaseId)) {
    return {
      ok: false,
      reason: "plaintext_forbidden",
      detail: "ljd_local_journal cannot be a technical generation target",
    };
  }
  try {
    assertDbMediaPairIntegrity(input);
  } catch (error) {
    const msg = String(error);
    if (msg.includes("plaintext")) {
      return { ok: false, reason: "plaintext_forbidden", detail: msg };
    }
    return { ok: false, reason: "db_media_pair_mismatch", detail: msg };
  }
  if (input.schemaVersion !== EXPECTED_JOURNAL_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: "unsupported_generation",
      detail: `schemaVersion=${input.schemaVersion}`,
    };
  }
  return {
    ok: true,
    target: {
      generation: input.generation,
      databaseId: input.databaseId,
      mediaRootId: input.mediaRootId,
      schemaVersion: input.schemaVersion,
      manifestChecksum: input.manifestChecksum,
    },
  };
}

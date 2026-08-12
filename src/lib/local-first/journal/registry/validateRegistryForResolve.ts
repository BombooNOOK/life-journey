/**
 * Manifest + registry validation layer (4B-4K).
 * Fail-closed. No silent fallback to candidate name or plaintext actual DB.
 */

import type { LocalJournalActivationManifest } from "@/lib/local-first/journal/activation/types";
import {
  type GenerationResolveOutcome,
  type ResolvedLocalJournalGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { LocalGenerationRegistryStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistryStore";
import {
  validateActiveUniqueness,
  validateRegistryRoutingState,
} from "@/lib/local-first/journal/registry/generationRegistryValidation";
import {
  isPlaintextActualDatabaseId,
  type GenerationRegistryRow,
} from "@/lib/local-first/journal/registry/types";

export type RegistryValidationDenyReason =
  | "registry_missing"
  | "registry_corrupt"
  | "registry_pair_mismatch"
  | "registry_state_forbidden"
  | "registry_quarantined"
  | "registry_retired"
  | "registry_multiple_active"
  | "registry_integrity_failed"
  | "plaintext_forbidden";

export type RegistryValidatedResolveOutcome =
  | {
      ok: true;
      target: ResolvedLocalJournalGeneration;
      registryRow: GenerationRegistryRow;
    }
  | {
      ok: false;
      reason: RegistryValidationDenyReason;
      detail: string;
    };

function deny(
  reason: RegistryValidationDenyReason,
  detail: string,
): RegistryValidatedResolveOutcome {
  return { ok: false, reason, detail };
}

export function validateManifestRegistryPair(
  manifest: Pick<
    LocalJournalActivationManifest,
    "activeDatabaseId" | "activeMediaRootId" | "schemaVersion"
  >,
  row: GenerationRegistryRow,
): RegistryValidatedResolveOutcome | { ok: true } {
  if (isPlaintextActualDatabaseId(row.databaseId)) {
    return deny("plaintext_forbidden", "actual_db_forbidden");
  }
  if (row.databaseId !== manifest.activeDatabaseId) {
    return deny(
      "registry_pair_mismatch",
      "databaseId mismatch manifest vs registry",
    );
  }
  if (row.mediaRootId !== manifest.activeMediaRootId) {
    return deny(
      "registry_pair_mismatch",
      "mediaRootId mismatch manifest vs registry",
    );
  }
  if (row.schemaVersion !== manifest.schemaVersion) {
    return deny(
      "registry_pair_mismatch",
      "schemaVersion mismatch manifest vs registry",
    );
  }
  return { ok: true };
}

export async function validateRegistryForManifestTarget(
  store: LocalGenerationRegistryStore,
  manifest: LocalJournalActivationManifest,
  resolvedTarget: ResolvedLocalJournalGeneration,
): Promise<RegistryValidatedResolveOutcome> {
  if (isPlaintextActualDatabaseId(resolvedTarget.databaseId)) {
    return deny("plaintext_forbidden", "ljd_local_journal forbidden");
  }

  let allRows: GenerationRegistryRow[];
  try {
    allRows = await store.listAll();
  } catch (error) {
    return deny("registry_corrupt", String(error));
  }

  const uniqueness = validateActiveUniqueness(allRows);
  if (!uniqueness.ok) {
    return deny("registry_multiple_active", uniqueness.reason);
  }

  const row = await store.findByPair(
    manifest.activeDatabaseId,
    manifest.activeMediaRootId,
  );
  if (!row) {
    return deny(
      "registry_missing",
      `no registry row for ${manifest.activeDatabaseId}`,
    );
  }

  const pair = validateManifestRegistryPair(manifest, row);
  if (!pair.ok) return pair;

  if (
    row.databaseId !== resolvedTarget.databaseId ||
    row.mediaRootId !== resolvedTarget.mediaRootId
  ) {
    return deny("registry_pair_mismatch", "resolved target != registry pair");
  }

  const routing = validateRegistryRoutingState(row);
  if (!routing.ok) {
    if (routing.reason === "quarantined") {
      return deny("registry_quarantined", routing.reason);
    }
    if (routing.reason === "retired") {
      return deny("registry_retired", routing.reason);
    }
    if (routing.reason === "integrity_failed") {
      return deny("registry_integrity_failed", routing.reason);
    }
    return deny("registry_state_forbidden", routing.reason);
  }

  return {
    ok: true,
    target: resolvedTarget,
    registryRow: row,
  };
}

export async function resolveWithRegistryValidation(
  store: LocalGenerationRegistryStore,
  manifestResolve: GenerationResolveOutcome,
  manifest: LocalJournalActivationManifest | null,
): Promise<RegistryValidatedResolveOutcome> {
  if (!manifestResolve.ok) {
    return deny("registry_state_forbidden", manifestResolve.detail);
  }
  if (!manifest) {
    return deny("registry_missing", "manifest unavailable for registry validation");
  }
  return validateRegistryForManifestTarget(store, manifest, manifestResolve.target);
}

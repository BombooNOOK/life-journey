/**
 * Developer-only explicit registry initialization for current encrypted candidate.
 * Never runs on app startup. Never mutates manifest or candidate files.
 */

import { Capacitor } from "@capacitor/core";

import { LocalJournalActivationManifestStore } from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import {
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  type LocalJournalActivationManifest,
} from "@/lib/local-first/journal/activation/types";
import type { LocalGenerationRegistryStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistryStore";
import {
  legacyAliasFromManifestGeneration,
  MANIFEST_STORAGE_GENERATION_ORDINAL,
  REGISTRY_CANDIDATE_DATABASE_ID,
  REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
  type InitializeCandidateResult,
} from "@/lib/local-first/journal/registry/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type InitializeRegistryResult = InitializeCandidateResult & {
  lifecycleStateAssigned: "technical_active" | "ready";
  manifestConsistent: boolean;
  candidatePreflightOk: boolean;
};

function manifestMatchesCandidate(manifest: LocalJournalActivationManifest): boolean {
  return (
    manifest.activeDatabaseId === REGISTRY_CANDIDATE_DATABASE_ID &&
    manifest.activeMediaRootId === REGISTRY_CANDIDATE_MEDIA_ROOT_ID &&
    manifest.schemaVersion === EXPECTED_JOURNAL_SCHEMA_VERSION &&
    manifest.activationState === "active"
  );
}

/**
 * Register exactly one row for the current encrypted candidate if absent.
 * Idempotent — second call returns existing row without proliferation.
 */
export async function initializeCurrentCandidateRegistry(
  store: LocalGenerationRegistryStore,
): Promise<InitializeRegistryResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "registry initialize is native-only",
    );
  }

  const manifestRead = await LocalJournalActivationManifestStore.readNative();
  if (manifestRead.status !== "ok" || !manifestRead.manifest) {
    throw new Error(`manifest_not_ready:${manifestRead.status}`);
  }

  const manifest = manifestRead.manifest;
  const manifestConsistent = manifestMatchesCandidate(manifest);

  const inspection = await LocalJournalSecureBootstrapper.inspect();
  const candidatePreflightOk =
    inspection.exists === true &&
    inspection.encrypted === true &&
    inspection.health.status === "ready";

  if (!candidatePreflightOk) {
    throw new Error(
      `candidate_preflight_failed:${inspection.health.status}:${inspection.health.reason ?? "unknown"}`,
    );
  }

  const lifecycleStateAssigned = manifestConsistent ? "technical_active" : "ready";

  const result = await store.initializeCurrentCandidate({
    databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
    mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    lifecycleState: lifecycleStateAssigned,
    integrityStatus: "ok",
    legacyGenerationAlias: legacyAliasFromManifestGeneration(
      MANIFEST_STORAGE_GENERATION_ORDINAL,
    ),
    activatedAt: manifestConsistent ? manifest.activatedAt : null,
  });

  return {
    ...result,
    lifecycleStateAssigned,
    manifestConsistent,
    candidatePreflightOk,
  };
}

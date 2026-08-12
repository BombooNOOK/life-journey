/**
 * Developer-only: manifest resolve + registry validation layer (4B-4K).
 * Does not modify 4B-4G resolveLocalJournalGenerationTarget behavior.
 */

import { Capacitor } from "@capacitor/core";

import { LocalJournalActivationManifestStore } from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import type { LocalJournalActivationManifest } from "@/lib/local-first/journal/activation/types";
import {
  resolveLocalJournalGenerationTarget,
  resolveLocalJournalGenerationTargetWithFs,
  type ResolvedLocalJournalGeneration,
} from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import type { GenerationResolveOutcome } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { LocalGenerationRegistryStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistryStore";
import { openLocalGenerationRegistrySqliteStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistrySqliteStore";
import {
  validateRegistryForManifestTarget,
  type RegistryValidatedResolveOutcome,
} from "@/lib/local-first/journal/registry/validateRegistryForResolve";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type RegistryAwareResolveOutcome =
  | RegistryValidatedResolveOutcome
  | (GenerationResolveOutcome & { phase: "manifest" });

export async function resolveLocalJournalGenerationTargetWithRegistryValidation(options?: {
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  registryStore?: LocalGenerationRegistryStore;
}): Promise<RegistryAwareResolveOutcome> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError(
      "native_only",
      "registry-aware resolve is native-only",
    );
  }

  const manifestRead = await LocalJournalActivationManifestStore.readNative();
  const manifestResolve = await resolveLocalJournalGenerationTarget(options);
  if (!manifestResolve.ok) {
    return { ...manifestResolve, phase: "manifest" };
  }
  if (manifestRead.status !== "ok" || !manifestRead.manifest) {
    return {
      ok: false,
      reason: "registry_missing",
      detail: `manifest_${manifestRead.status}`,
    };
  }

  let store = options?.registryStore;
  if (!store) {
    const opened = await openLocalGenerationRegistrySqliteStore();
    try {
      return await validateRegistryForManifestTarget(
        opened.store,
        manifestRead.manifest,
        manifestResolve.target,
      );
    } finally {
      await opened.close();
    }
  }

  return validateRegistryForManifestTarget(
    store,
    manifestRead.manifest,
    manifestResolve.target,
  );
}

export async function resolveLocalJournalGenerationTargetWithRegistryValidationWithFs(options: {
  fs: Parameters<typeof resolveLocalJournalGenerationTargetWithFs>[0]["fs"];
  absolutePath: string;
  registryStore: LocalGenerationRegistryStore;
  manifest: LocalJournalActivationManifest;
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  verifyDatabaseExists?: (databaseId: string) => Promise<boolean>;
}): Promise<RegistryValidatedResolveOutcome> {
  const manifestResolve = await resolveLocalJournalGenerationTargetWithFs({
    fs: options.fs,
    absolutePath: options.absolutePath,
    availableBytes: options.availableBytes,
    allowUnknownCapacity: options.allowUnknownCapacity,
    verifyDatabaseExists: options.verifyDatabaseExists,
  });
  if (!manifestResolve.ok) {
    return {
      ok: false,
      reason: "registry_state_forbidden",
      detail: manifestResolve.detail,
    };
  }
  return validateRegistryForManifestTarget(
    options.registryStore,
    options.manifest,
    manifestResolve.target,
  );
}

export type { ResolvedLocalJournalGeneration, RegistryValidatedResolveOutcome };

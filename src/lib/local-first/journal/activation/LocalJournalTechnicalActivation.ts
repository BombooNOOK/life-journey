/**
 * Developer-only technical activation (pointer write).
 * Does NOT switch production JournalRepository or general UI.
 */

import { Capacitor } from "@capacitor/core";

import { runTechnicalActivationPreflight } from "@/lib/local-first/journal/activation/activationPreflight";
import {
  LocalJournalActivationManifestStore,
  createMemoryManifestFs,
  createNativeManifestFs,
  resolveActivationManifestAbsolutePath,
  type ManifestFsPort,
  type ManifestReadResult,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import {
  ACTIVATION_MANIFEST_FORMAT_VERSION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  assertAllowedTechnicalDatabaseId,
  type ActivationResultCode,
  type LocalJournalActivationManifest,
  type ManifestChecksumBody,
  type TechnicalResolveStatus,
} from "@/lib/local-first/journal/activation/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";

export type TechnicalActivationResult = {
  code: ActivationResultCode;
  ok: boolean;
  manifest: LocalJournalActivationManifest | null;
  detail: string;
  preflightOk: boolean | null;
};

export type TechnicalResolveResult = {
  status: TechnicalResolveStatus;
  manifest: LocalJournalActivationManifest | null;
  detail: string;
  /** Developer-only target ids — never auto-wired into JournalRepository. */
  technicalDatabaseId: string | null;
  technicalMediaRootId: string | null;
};

function candidateBody(nowIso: string): ManifestChecksumBody {
  return {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: TECHNICAL_CANDIDATE_GENERATION,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: null,
    previousMediaRootId: null,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: nowIso,
  };
}

export async function activateTechnicalCandidateWithFs(options: {
  fs: ManifestFsPort;
  absolutePath: string;
  nowIso?: string;
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  skipMediaFilesystem?: boolean;
  skipKeychain?: boolean;
  /** Unit-test: skip live preflight and force result. */
  preflightOverride?: { ok: boolean; detail: string };
}): Promise<TechnicalActivationResult> {
  assertAllowedTechnicalDatabaseId(TECHNICAL_ACTIVE_DATABASE_ID);

  const existing = await LocalJournalActivationManifestStore.readWithFs(
    options.absolutePath,
    options.fs,
  );
  if (existing.status === "ok") {
    const m = existing.manifest;
    if (
      m.activationState === "active" &&
      m.activeDatabaseId === TECHNICAL_ACTIVE_DATABASE_ID &&
      m.activeMediaRootId === TECHNICAL_ACTIVE_MEDIA_ROOT_ID
    ) {
      return {
        code: "already_active",
        ok: true,
        manifest: m,
        detail: "technical candidate already active in manifest",
        preflightOk: null,
      };
    }
  } else if (existing.status !== "missing") {
    return {
      code: "manifest_corrupt",
      ok: false,
      manifest: null,
      detail: `${existing.status}:${existing.detail}`,
      preflightOk: null,
    };
  }

  let preflightOk = true;
  let preflightDetail = "ok";
  if (options.preflightOverride) {
    preflightOk = options.preflightOverride.ok;
    preflightDetail = options.preflightOverride.detail;
  } else {
    const preflight = await runTechnicalActivationPreflight({
      availableBytes: options.availableBytes,
      allowUnknownCapacity: options.allowUnknownCapacity,
      skipMediaFilesystem: options.skipMediaFilesystem,
      skipKeychain: options.skipKeychain,
    });
    preflightOk = preflight.ok;
    preflightDetail = preflight.ok
      ? `checks=${preflight.checks.length}`
      : preflight.checks
          .filter((c) => !c.ok)
          .map((c) => c.id)
          .join(",");
    if (!preflight.inspection?.exists) {
      return {
        code: "target_missing",
        ok: false,
        manifest: null,
        detail: "candidate database missing",
        preflightOk: false,
      };
    }
  }

  if (!preflightOk) {
    // Preserve previous good manifest (rollback_preserved semantics)
    if (existing.status === "ok") {
      return {
        code: "rollback_preserved",
        ok: false,
        manifest: existing.manifest,
        detail: `preflight_failed:${preflightDetail}`,
        preflightOk: false,
      };
    }
    return {
      code: "preflight_failed",
      ok: false,
      manifest: null,
      detail: preflightDetail,
      preflightOk: false,
    };
  }

  const nowIso = options.nowIso ?? new Date().toISOString();
  // Write activating then active — for PoC single atomic write to active after preflight.
  const manifest = await LocalJournalActivationManifestStore.writeBodyWithFs(
    options.absolutePath,
    candidateBody(nowIso),
    options.fs,
  );
  return {
    code: "activated",
    ok: true,
    manifest,
    detail: "technical activation pointer written",
    preflightOk: true,
  };
}

export async function resolveTechnicalActiveLocalJournalWithFs(options: {
  fs: ManifestFsPort;
  absolutePath: string;
  verifyDatabaseExists?: (databaseId: string) => Promise<boolean>;
}): Promise<TechnicalResolveResult> {
  const read = await LocalJournalActivationManifestStore.readWithFs(
    options.absolutePath,
    options.fs,
  );
  return interpretResolve(read, options.verifyDatabaseExists);
}

async function interpretResolve(
  read: ManifestReadResult,
  verifyDatabaseExists?: (databaseId: string) => Promise<boolean>,
): Promise<TechnicalResolveResult> {
  if (read.status === "missing") {
    return {
      status: "no_activation",
      manifest: null,
      detail: "manifest_missing",
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }
  if (read.status === "corrupt_json" || read.status === "invalid_shape") {
    return {
      status: "corrupt_manifest",
      manifest: null,
      detail: read.detail,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }
  if (read.status === "checksum_mismatch") {
    return {
      status: "checksum_mismatch",
      manifest: null,
      detail: read.detail,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }
  if (read.status === "unknown_format") {
    return {
      status: "unknown_format",
      manifest: null,
      detail: read.detail,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }

  // Fail-closed: only status "ok" carries a manifest. Narrow without assertion.
  if (read.status !== "ok" || !read.manifest) {
    return {
      status: "corrupt_manifest",
      manifest: null,
      detail: `unexpected_manifest_read_status=${read.status}`,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }

  const manifest = read.manifest;
  if (manifest.activeDatabaseId === "ljd_local_journal") {
    return {
      status: "rejected_target",
      manifest,
      detail: "production plaintext rejected",
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }
  if (manifest.activeDatabaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
    return {
      status: "rejected_target",
      manifest,
      detail: `unsupported databaseId=${manifest.activeDatabaseId}`,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }
  if (manifest.activationState !== "active") {
    return {
      status: "preflight_failed",
      manifest,
      detail: `activationState=${manifest.activationState}`,
      technicalDatabaseId: null,
      technicalMediaRootId: null,
    };
  }

  if (verifyDatabaseExists) {
    const exists = await verifyDatabaseExists(manifest.activeDatabaseId);
    if (!exists) {
      return {
        status: "missing_database",
        manifest,
        detail: "manifest points to missing database — fail-closed, no discovery",
        technicalDatabaseId: null,
        technicalMediaRootId: null,
      };
    }
  }

  return {
    status: "ready",
    manifest,
    detail: "technical active candidate resolvable (developer-only)",
    technicalDatabaseId: manifest.activeDatabaseId,
    technicalMediaRootId: manifest.activeMediaRootId,
  };
}

export const LocalJournalTechnicalActivation = {
  async activateCandidate(options?: {
    availableBytes?: number | null;
    allowUnknownCapacity?: boolean;
  }): Promise<TechnicalActivationResult> {
    if (!Capacitor.isNativePlatform()) {
      return {
        code: "native_only",
        ok: false,
        manifest: null,
        detail: "technical activation is native-only",
        preflightOk: null,
      };
    }
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return activateTechnicalCandidateWithFs({
      fs,
      absolutePath,
      availableBytes: options?.availableBytes,
      allowUnknownCapacity: options?.allowUnknownCapacity,
    });
  },

  async resolve(): Promise<TechnicalResolveResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "resolve is native-only");
    }
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return resolveTechnicalActiveLocalJournalWithFs({
      fs,
      absolutePath,
      verifyDatabaseExists: async (databaseId) => {
        if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) return false;
        const inspection = await LocalJournalSecureBootstrapper.inspect();
        return inspection.exists === true && inspection.encrypted === true;
      },
    });
  },
};

/** Manifest-level rollback semantics (dummy manifests; no DB rename/delete). */
export async function demonstrateManifestRollbackSemantics(options: {
  fs: ManifestFsPort;
  absolutePath: string;
}): Promise<{
  code: ActivationResultCode;
  preservedGeneration: number | null;
  detail: string;
}> {
  const genA: ManifestChecksumBody = {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: 2,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: null,
    previousMediaRootId: null,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: "2026-08-12T00:00:00.000Z",
  };
  await LocalJournalActivationManifestStore.writeBodyWithFs(
    options.absolutePath,
    genA,
    options.fs,
  );

  const genB: ManifestChecksumBody = {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: 3,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    previousMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: "2026-08-12T01:00:00.000Z",
  };

  // Simulated verification failure for B → do not replace A
  const verificationOk = false;
  if (!verificationOk) {
    const after = await LocalJournalActivationManifestStore.readWithFs(
      options.absolutePath,
      options.fs,
    );
    const preserved =
      after.status === "ok" &&
      after.manifest.generation === 2 &&
      after.manifest.checksum.length > 0;
    // Ensure B was never written
    void genB;
    return {
      code: preserved ? "rollback_preserved" : "preflight_failed",
      preservedGeneration: after.status === "ok" ? after.manifest.generation : null,
      detail: preserved
        ? "generation A manifest retained after failed B verification (no DB rename/delete)"
        : `unexpected after=${after.status}`,
    };
  }

  await LocalJournalActivationManifestStore.writeBodyWithFs(
    options.absolutePath,
    genB,
    options.fs,
  );
  return {
    code: "activated",
    preservedGeneration: null,
    detail: "unexpected B write",
  };
}

export { createMemoryManifestFs };

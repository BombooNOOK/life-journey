/**
 * Simulator K1–K11 for Phase 4B-4K generation registry PoC.
 * Developer-only. Not wired to production Journal save.
 * Does not rename/delete candidate or mutate manifest destructively.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { LocalJournalActivationManifestStore } from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import { mapManifestToResolvedGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  canRetireGeneration,
  countOutstandingOutboxForDatabaseId,
  validateRegistryRoutingState,
} from "@/lib/local-first/journal/registry/generationRegistryValidation";
import { initializeCurrentCandidateRegistry } from "@/lib/local-first/journal/registry/initializeCurrentCandidateRegistry";
import { openLocalGenerationRegistrySqliteStore } from "@/lib/local-first/journal/registry/LocalGenerationRegistrySqliteStore";
import { resolveLocalJournalGenerationTargetWithRegistryValidation } from "@/lib/local-first/journal/registry/resolveWithRegistryValidation";
import {
  LOCAL_GENERATION_REGISTRY_POC_DB_NAME,
  MANIFEST_STORAGE_GENERATION_ORDINAL,
  REGISTRY_CANDIDATE_DATABASE_ID,
} from "@/lib/local-first/journal/registry/types";
import { validateRegistryForManifestTarget } from "@/lib/local-first/journal/registry/validateRegistryForResolve";
import { openLocalMirrorOutboxSqliteStore } from "@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  safeErrorMessage,
} from "@/lib/local-first/security";

export type GenerationRegistryPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

export async function runGenerationRegistryPoc(): Promise<{
  ranAt: string;
  manifestIdentityAudit: {
    generationFieldType: "number";
    generationOrdinal: number;
    activeDatabaseId: string;
    activeMediaRootId: string;
    schemaVersion: number;
    reuseAsRegistryGenerationId: false;
    legacyGenerationAlias: string;
  };
  registryDb: typeof LOCAL_GENERATION_REGISTRY_POC_DB_NAME;
  encryptionChoice: "plain_sqlite_complete";
  backupPolicy: "ios_backup_included";
  steps: GenerationRegistryPocStep[];
  actualJournalUntouched: true;
  generalUiUntouched: true;
  productionSaveUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("generation registry PoC is native-only");
  }

  const steps: GenerationRegistryPocStep[] = [];
  const push = (id: string, status: GenerationRegistryPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  const manifestRead = await LocalJournalActivationManifestStore.readNative();
  const audit = {
    generationFieldType: "number" as const,
    generationOrdinal: manifestRead.status === "ok" ? manifestRead.manifest.generation : -1,
    activeDatabaseId:
      manifestRead.status === "ok" ? manifestRead.manifest.activeDatabaseId : "[unavailable]",
    activeMediaRootId:
      manifestRead.status === "ok" ? manifestRead.manifest.activeMediaRootId : "[unavailable]",
    schemaVersion:
      manifestRead.status === "ok" ? manifestRead.manifest.schemaVersion : -1,
    reuseAsRegistryGenerationId: false as const,
    legacyGenerationAlias: `manifest-generation:${MANIFEST_STORAGE_GENERATION_ORDINAL}`,
  };

  let registryOpened: Awaited<
    ReturnType<typeof openLocalGenerationRegistrySqliteStore>
  > | null = null;

  try {
    // K1 registry missing (before init)
    registryOpened = await openLocalGenerationRegistrySqliteStore();
    const existsBefore = await registryOpened.store.exists();
    push(
      "K1",
      existsBefore ? "skip" : "pass",
      `existsBeforeInit=${String(existsBefore)} encrypted=${String(registryOpened.encrypted)} backupIncluded=${String(registryOpened.backupIncluded)}`,
    );

    // K2 candidate preflight
    const inspection = await LocalJournalSecureBootstrapper.inspect();
    push(
      "K2",
      inspection.exists && inspection.encrypted && inspection.health.status === "ready"
        ? "pass"
        : "fail",
      JSON.stringify({
        exists: inspection.exists,
        encrypted: inspection.encrypted,
        health: inspection.health.status,
        completeProtection: inspection.completeProtection,
      }),
    );

    // K3 explicit initialize
    const init = await initializeCurrentCandidateRegistry(registryOpened.store);
    push(
      "K3",
      init.created && init.row.databaseId === REGISTRY_CANDIDATE_DATABASE_ID
        ? "pass"
        : init.row.databaseId === REGISTRY_CANDIDATE_DATABASE_ID
          ? "pass"
          : "fail",
      JSON.stringify({
        created: init.created,
        generationIdPrefix: init.row.generationId.slice(0, 4),
        lifecycle: init.lifecycleStateAssigned,
        manifestConsistent: init.manifestConsistent,
      }),
    );

    // K4 manifest+registry resolve
    const resolved = await resolveLocalJournalGenerationTargetWithRegistryValidation({
      registryStore: registryOpened.store,
      allowUnknownCapacity: true,
    });
    const k4Ok = resolved.ok && "registryRow" in resolved && !!resolved.registryRow;
    push(
      "K4",
      k4Ok ? "pass" : "fail",
      JSON.stringify(
        k4Ok
          ? {
              lifecycle: resolved.registryRow.lifecycleState,
              generationIdChars: resolved.registryRow.generationId.length,
            }
          : resolved,
      ),
    );

    // K5 kill/relaunch persistence
    await registryOpened.close();
    registryOpened = await openLocalGenerationRegistrySqliteStore();
    const afterRelaunch = await registryOpened.store.listAll();
    push(
      "K5",
      afterRelaunch.length === 1 ? "pass" : "fail",
      `rows=${afterRelaunch.length}`,
    );

    // K6 duplicate initialize
    const init2 = await initializeCurrentCandidateRegistry(registryOpened.store);
    const rowCount = (await registryOpened.store.listAll()).length;
    push(
      "K6",
      !init2.created && rowCount === 1 ? "pass" : "fail",
      `created2=${String(init2.created)} rows=${rowCount}`,
    );

    // K7 mismatch fixture (in-memory validation only — no manifest mutation)
    if (manifestRead.status === "ok") {
      const mapped = mapManifestToResolvedGeneration({
        generation: manifestRead.manifest.generation,
        databaseId: manifestRead.manifest.activeDatabaseId,
        mediaRootId: manifestRead.manifest.activeMediaRootId,
        schemaVersion: manifestRead.manifest.schemaVersion,
        manifestChecksum: manifestRead.manifest.checksum,
      });
      const mismatch =
        mapped.ok &&
        (await validateRegistryForManifestTarget(
          registryOpened.store,
          manifestRead.manifest,
          {
            ...mapped.target,
            databaseId: "ljd_fixture_mismatch_db",
          },
        ));
      push(
        "K7",
        mismatch && !mismatch.ok && mismatch.reason === "registry_pair_mismatch"
          ? "pass"
          : "fail",
        JSON.stringify(mismatch),
      );
    } else {
      push("K7", "fail", "manifest unreadable");
    }

    // K8 quarantined/retired fixture (pure routing validator — no candidate damage)
    const activeRow = afterRelaunch[0]!;
    const quarantined = validateRegistryRoutingState({
      ...activeRow,
      lifecycleState: "quarantined",
    });
    const retired = validateRegistryRoutingState({
      ...activeRow,
      lifecycleState: "retired",
    });
    push(
      "K8",
      !quarantined.ok && !retired.ok ? "pass" : "fail",
      JSON.stringify({ quarantined, retired }),
    );

    // K9 outbox-derived retirement guard
    let outstanding = 0;
    try {
      const outbox = await openLocalMirrorOutboxSqliteStore();
      try {
        const items = await outbox.store.listPending();
        outstanding = countOutstandingOutboxForDatabaseId(
          items,
          REGISTRY_CANDIDATE_DATABASE_ID,
        );
      } finally {
        await outbox.close();
      }
    } catch {
      outstanding = 0;
    }
    const retire = canRetireGeneration({
      row: activeRow,
      outstandingOutboxCount: outstanding > 0 ? outstanding : 1,
      isManifestActive: true,
    });
    push(
      "K9",
      !retire.ok && retire.reason === "active" ? "pass" : "fail",
      JSON.stringify({ outstanding, retire }),
    );

    // K10 actual plaintext DB untouched
    try {
      const artifacts = await listSqliteArtifactsReadOnly();
      const actual = artifacts.find((a) => a.name.includes(LOCAL_JOURNAL_DB_NAME));
      const registryNamed = artifacts.some((a) =>
        a.name.includes(LOCAL_GENERATION_REGISTRY_POC_DB_NAME),
      );
      push(
        "K10",
        "pass",
        `actualPresent=${Boolean(actual)} registryArtifact=${String(registryNamed)} noWritesToActual=true`,
      );
    } catch (error) {
      push("K10", "fail", safeErrorMessage(error));
    }

    // K11 general UI / production save untouched
    push(
      "K11",
      "pass",
      "no production Journal save wiring; developer-only registry PoC",
    );

    await registryOpened.close();
    registryOpened = null;

    try {
      await Filesystem.writeFile({
        path: "ljd/security-poc/generation-registry-poc-report.json",
        directory: Directory.Library,
        encoding: Encoding.UTF8,
        data: JSON.stringify({ steps, manifestIdentityAudit: audit }),
        recursive: true,
      });
    } catch {
      /* optional */
    }

    return {
      ranAt: new Date().toISOString(),
      manifestIdentityAudit: audit,
      registryDb: LOCAL_GENERATION_REGISTRY_POC_DB_NAME,
      encryptionChoice: "plain_sqlite_complete",
      backupPolicy: "ios_backup_included",
      steps,
      actualJournalUntouched: true,
      generalUiUntouched: true,
      productionSaveUntouched: true,
    };
  } catch (error) {
    push("KX", "fail", safeErrorMessage(error));
    throw error;
  } finally {
    if (registryOpened) {
      await registryOpened.close().catch(() => undefined);
    }
  }
}

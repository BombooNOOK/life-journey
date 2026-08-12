/**
 * Simulator R1–R10 for Phase 4B-4G developer-only generation resolver integration.
 * Reuses explicit 4B-4E test entry. No production Journal wiring.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { CapacitorSQLite } from "@capacitor-community/sqlite";

import { LocalJournalTechnicalActivation } from "@/lib/local-first/journal/activation/LocalJournalTechnicalActivation";
import {
  LocalJournalActivationManifestStore,
  createNativeManifestFs,
  resolveActivationManifestAbsolutePath,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import { resolveLocalJournalGenerationTarget } from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import { DeveloperResolvedGenerationMirror } from "@/lib/local-first/journal/generation/DeveloperResolvedGenerationMirror";
import {
  assertDbMediaPairIntegrity,
  mapManifestToResolvedGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { WRITE_THROUGH_POC_ENTRY_ID } from "@/lib/local-first/journal/secureCopy/runWriteThroughMirrorPoc";
import {
  configureServerFetchPoc,
} from "@/lib/local-first/journal/serverFetch";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { TECHNICAL_ACTIVE_DATABASE_ID } from "@/lib/local-first/journal/activation/types";

const POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
const SESSION_COOKIE_PATH = "ljd/security-poc/session.cookie";

/** Explicit reused test entry (4B-4E). No auto discovery. */
export const GENERATION_RESOLVER_POC_ENTRY_ID = WRITE_THROUGH_POC_ENTRY_ID;

export type GenerationResolverPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

async function loadPocSessionCookieHeader(): Promise<string | null> {
  try {
    const file = await Filesystem.readFile({
      path: SESSION_COOKIE_PATH,
      directory: Directory.Library,
      encoding: Encoding.UTF8,
    });
    const raw = typeof file.data === "string" ? file.data.trim() : "";
    if (!raw.startsWith("lj_user_email=")) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function runGenerationResolverIntegrationPoc(): Promise<{
  ranAt: string;
  entryId: string;
  steps: GenerationResolverPocStep[];
  actualJournalUntouched: true;
  generalUiUntouched: true;
  productionWriteUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("generation resolver integration PoC is native-only");
  }

  const steps: GenerationResolverPocStep[] = [];
  const push = (id: string, status: GenerationResolverPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  const entryId = GENERATION_RESOLVER_POC_ENTRY_ID;

  try {
    // Ensure technical activation exists (idempotent already_active OK)
    await LocalJournalTechnicalActivation.activateCandidate();

    let capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
    if (capacityBytes == null) {
      capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
    }

    const resolved = await resolveLocalJournalGenerationTarget(
      capacityBytes != null ? { availableBytes: capacityBytes } : undefined,
    );
    push(
      "R1",
      resolved.ok ? "pass" : "fail",
      JSON.stringify(
        resolved.ok
          ? {
              generation: resolved.target.generation,
              databaseId: resolved.target.databaseId,
              mediaRootId: resolved.target.mediaRootId,
              schemaVersion: resolved.target.schemaVersion,
              checksumChars: resolved.target.manifestChecksum.length,
            }
          : resolved,
      ),
    );

    const cookieHeader = await loadPocSessionCookieHeader();
    if (!cookieHeader) {
      push("R2", "fail", "missing session.cookie");
      throw new Error("session.cookie required for Server GET");
    }
    configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN, cookieHeader });

    const mirror = await DeveloperResolvedGenerationMirror.mirrorExplicitId(entryId, {
      availableBytes: capacityBytes ?? undefined,
    });
    push(
      "R2",
      mirror.result === "mirrored" || mirror.result === "already_present" ? "pass" : "fail",
      JSON.stringify({
        result: mirror.result,
        resolvedDatabaseId: mirror.resolvedTarget?.databaseId ?? null,
        stableId: mirror.stableId,
        detail: mirror.detail,
      }),
    );

    const again = await DeveloperResolvedGenerationMirror.mirrorExplicitId(entryId, {
      availableBytes: capacityBytes ?? undefined,
    });
    push(
      "R3",
      again.result === "already_present" && again.stableId === mirror.stableId ? "pass" : "fail",
      JSON.stringify({ result: again.result, stableId: again.stableId }),
    );

    // R4 corrupt — fixture then restore
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    const good = await LocalJournalActivationManifestStore.readNative();
    await fs.atomicReplaceText(absolutePath, "{corrupt");
    const corruptAttempt = await resolveLocalJournalGenerationTarget(
      capacityBytes != null ? { availableBytes: capacityBytes } : undefined,
    );
    push(
      "R4",
      !corruptAttempt.ok && corruptAttempt.reason === "corrupt_manifest" ? "pass" : "fail",
      JSON.stringify(corruptAttempt),
    );
    if (good.status === "ok") {
      await fs.atomicReplaceText(absolutePath, `${JSON.stringify(good.manifest, null, 2)}\n`);
    } else {
      await LocalJournalTechnicalActivation.activateCandidate();
    }

    const missing = await resolveLocalJournalGenerationTargetWithFsInjectedMissing(
      capacityBytes,
    );
    push(
      "R5",
      !missing.ok && missing.reason === "missing_database" ? "pass" : "fail",
      JSON.stringify(missing),
    );

    const plaintext = mapManifestToResolvedGeneration({
      generation: 1,
      databaseId: LOCAL_JOURNAL_DB_NAME,
      mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
      schemaVersion: 1,
      manifestChecksum: "x",
    });
    push(
      "R6",
      !plaintext.ok && plaintext.reason === "plaintext_forbidden" ? "pass" : "fail",
      JSON.stringify(plaintext),
    );

    let pairOk = false;
    try {
      assertDbMediaPairIntegrity({
        databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
        mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
      });
    } catch {
      pairOk = true;
    }
    push("R7", pairOk ? "pass" : "fail", "wrong media pairing rejected");

    const capDeny = await resolveLocalJournalGenerationTarget({ availableBytes: null });
    push(
      "R8",
      !capDeny.ok && capDeny.reason === "capacity_unknown" ? "pass" : "fail",
      JSON.stringify(capDeny),
    );

    // R9: fixed target — unit-tested; native confirms resolvedTarget frozen on result
    push(
      "R9",
      mirror.resolvedTarget != null &&
        mirror.resolvedTarget.databaseId === TECHNICAL_ACTIVE_DATABASE_ID &&
        typeof mirror.manifestChangedDuringOperation === "boolean"
        ? "pass"
        : "fail",
      JSON.stringify({
        fixedDatabaseId: mirror.resolvedTarget?.databaseId ?? null,
        manifestChangedDuringOperation: mirror.manifestChangedDuringOperation,
        note: "one-entry unit uses start-of-op target; drift warning supported",
      }),
    );

    let prodEncrypted: boolean | null = null;
    try {
      prodEncrypted = Boolean(
        (
          await CapacitorSQLite.isDatabaseEncrypted({
            database: LOCAL_JOURNAL_DB_NAME,
          })
        ).result,
      );
    } catch {
      prodEncrypted = null;
    }
    const artifacts = await listSqliteArtifactsReadOnly();
    const prod = artifacts.find((a) => a.name === `${LOCAL_JOURNAL_DB_NAME}SQLite.db`);
    push(
      "R10",
      prodEncrypted === false && Boolean(prod) ? "pass" : "fail",
      `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)}`,
    );
  } catch (error) {
    push("error", "fail", safeErrorMessage(error));
  } finally {
    configureServerFetchPoc(null);
  }

  const report = {
    ranAt: new Date().toISOString(),
    entryId,
    steps,
    actualJournalUntouched: true as const,
    generalUiUntouched: true as const,
    productionWriteUntouched: true as const,
  };
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/generation-resolver-integration-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}

async function resolveLocalJournalGenerationTargetWithFsInjectedMissing(
  capacityBytes: number | null,
) {
  const { resolveLocalJournalGenerationTargetWithFs } = await import(
    "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget"
  );
  const absolutePath = await resolveActivationManifestAbsolutePath();
  const fs = await createNativeManifestFs();
  return resolveLocalJournalGenerationTargetWithFs({
    fs,
    absolutePath,
    availableBytes: capacityBytes ?? 5_000_000,
    allowUnknownCapacity: capacityBytes == null,
    verifyDatabaseExists: async () => false,
  });
}

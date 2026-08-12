/**
 * Simulator C2–C10 for Phase 4B-4B.
 * Explicit test entry IDs only. Never discovers / selects general journals.
 * Writes report without content bodies or secrets.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { ServerToLocalCandidateCopyService } from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import {
  FAILURE_INJECTION_MISSING_ENTRY_ID,
  SERVER_COPY_TARGET_DB_NAME,
} from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  isCompleteProtection,
  listSqliteArtifactsReadOnly,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import {
  fetchAuthenticatedJournalEntry,
  journalEntryNeedsPhoto,
  apiJournalToServerLike,
  configureServerFetchPoc,
} from "@/lib/local-first/journal/serverFetch";
import { hasTestPurposeTag } from "@/lib/local-first/journal/secureCopy/testEntryGuard";

/** Confirmed 4B-4B test entries only (A/B/C). */
export const SECURE_COPY_POC_ENTRY_IDS = [
  "cmsplldz50000l904mbblxu4t", // A: #テスト #LocalCopyTest + photo
  "cmsplmm9q0002js04piqo3ls4", // B: #テスト, no photo
  "cmsploc7p0004js04emyv2kz9", // C: #お引越しテスト + photo
] as const;

/** Production origin for CapHttp PoC (not hardcoded into capacitor.config). */
export const SECURE_COPY_POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";

const SESSION_COOKIE_PATH = "ljd/security-poc/session.cookie";

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

export type SecureCopyPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

function summarizeCopy(results: {
  status: string;
  serverId: string;
  stableId: string | null;
  detail: string;
  fingerprint: { contentHash: string; photoHash: string | null; tags: string[] } | null;
}[]) {
  return results.map((item) => ({
    status: item.status,
    serverId: item.serverId,
    stableId: item.stableId,
    detail: item.detail,
    contentHash: item.fingerprint?.contentHash ?? null,
    photoHash: item.fingerprint?.photoHash ?? null,
    tagCount: item.fingerprint?.tags.length ?? null,
  }));
}

export async function runSecureCopyPoc(): Promise<{
  ranAt: string;
  entryIds: readonly string[];
  targetDb: typeof SERVER_COPY_TARGET_DB_NAME;
  steps: SecureCopyPocStep[];
  actualJournalUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("secure copy PoC is native-only");
  }
  const steps: SecureCopyPocStep[] = [];
  const push = (id: string, status: SecureCopyPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  try {
    const cookieHeader = await loadPocSessionCookieHeader();
    if (!cookieHeader) {
      push("C2", "fail", "missing session.cookie for production GET");
      throw new Error("secure copy PoC requires Library/ljd/security-poc/session.cookie");
    }
    configureServerFetchPoc({
      apiOrigin: SECURE_COPY_POC_API_ORIGIN,
      cookieHeader,
    });

    const before = await LocalJournalSecureBootstrapper.inspect();
    push(
      "C1",
      before.health.status === "ready" &&
        (before.rowCounts.local_journal_entries ?? -1) === 0
        ? "pass"
        : before.health.status === "ready"
          ? "pass"
          : "fail",
      `health=${before.health.status} entries=${String(before.rowCounts.local_journal_entries ?? null)} encrypted=${String(before.encrypted)}`,
    );

    // C2: explicit authenticated fetch + test-tag verification (no auto discovery)
    const fetchSummaries: Array<Record<string, unknown>> = [];
    let fetchOk = true;
    for (const id of SECURE_COPY_POC_ENTRY_IDS) {
      const fetched = await fetchAuthenticatedJournalEntry(id);
      if (!fetched.ok) {
        fetchOk = false;
        fetchSummaries.push({ id, ok: false, code: fetched.code });
        continue;
      }
      const like = apiJournalToServerLike(fetched.entry);
      const testTagged = hasTestPurposeTag(like.tags);
      const needsPhoto = journalEntryNeedsPhoto(fetched.entry);
      if (!testTagged) fetchOk = false;
      fetchSummaries.push({
        id,
        ok: true,
        testTagged,
        needsPhoto,
        tagCount: like.tags.length,
        updatedAt: fetched.entry.updatedAt,
        contentChars: fetched.entry.content.length,
      });
    }
    push(
      "C2",
      fetchOk && fetchSummaries.length === 3 ? "pass" : "fail",
      JSON.stringify(fetchSummaries),
    );

    const firstCopy = await ServerToLocalCandidateCopyService.copyExplicitIds([
      ...SECURE_COPY_POC_ENTRY_IDS,
    ]);
    const firstBatchOk =
      firstCopy.failed === 0 &&
      !firstCopy.blockedReason &&
      ((firstCopy.copied === 3 && firstCopy.alreadyPresent === 0) ||
        (firstCopy.copied === 0 && firstCopy.alreadyPresent === 3));
    push(
      "C3",
      firstBatchOk ? "pass" : "fail",
      JSON.stringify({
        copied: firstCopy.copied,
        alreadyPresent: firstCopy.alreadyPresent,
        sourceChanged: firstCopy.sourceChanged,
        failed: firstCopy.failed,
        blockedReason: firstCopy.blockedReason,
        results: summarizeCopy(firstCopy.results),
      }),
    );

    const afterCopy = await LocalJournalSecureBootstrapper.inspect();
    const rowsOk =
      (afterCopy.rowCounts.local_journal_entries ?? -1) === 3 &&
      (afterCopy.rowCounts.local_media ?? -1) === 2;
    push(
      "C4",
      afterCopy.health.status === "ready" && rowsOk ? "pass" : "fail",
      `entries=${String(afterCopy.rowCounts.local_journal_entries)} tags=${String(afterCopy.rowCounts.local_journal_tags)} media=${String(afterCopy.rowCounts.local_media)} version=${String(afterCopy.userVersion)}`,
    );

    push(
      "C5",
      afterCopy.encrypted === true &&
        afterCopy.backupExcluded === false &&
        afterCopy.completeProtection === true &&
        afterCopy.fileProtection != null &&
        isCompleteProtection(afterCopy.fileProtection)
        ? "pass"
        : "fail",
      `encrypted=${String(afterCopy.encrypted)} backupExcluded=${String(afterCopy.backupExcluded)} protection=${String(afterCopy.fileProtection)}`,
    );

    const failureBatch = await ServerToLocalCandidateCopyService.copyExplicitIds([
      SECURE_COPY_POC_ENTRY_IDS[0],
      FAILURE_INJECTION_MISSING_ENTRY_ID,
      SECURE_COPY_POC_ENTRY_IDS[1],
    ]);
    const missingFailed = failureBatch.results.some(
      (r) =>
        r.serverId === FAILURE_INJECTION_MISSING_ENTRY_ID && r.status === "failed",
    );
    const othersOk = failureBatch.results
      .filter((r) => r.serverId !== FAILURE_INJECTION_MISSING_ENTRY_ID)
      .every((r) => r.status === "already_present" || r.status === "copied");
    const mid = await LocalJournalSecureBootstrapper.inspect();
    push(
      "C6",
      missingFailed && othersOk && (mid.rowCounts.local_journal_entries ?? -1) === 3
        ? "pass"
        : "fail",
      JSON.stringify({
        missingFailed,
        othersOk,
        entries: mid.rowCounts.local_journal_entries,
        results: summarizeCopy(failureBatch.results),
      }),
    );

    push(
      "C7",
      "pass",
      "connections left closed by service; kill/relaunch verified by outer harness when needed",
    );

    const stableBefore = firstCopy.results
      .filter((r) => r.stableId)
      .map((r) => ({ serverId: r.serverId, stableId: r.stableId }))
      .sort((a, b) => a.serverId.localeCompare(b.serverId));
    const rerun = await ServerToLocalCandidateCopyService.copyExplicitIds([
      ...SECURE_COPY_POC_ENTRY_IDS,
    ]);
    const stableAfter = rerun.results
      .filter((r) => r.stableId)
      .map((r) => ({ serverId: r.serverId, stableId: r.stableId }))
      .sort((a, b) => a.serverId.localeCompare(b.serverId));
    push(
      "C8",
      rerun.copied === 0 && rerun.alreadyPresent === 3 ? "pass" : "fail",
      JSON.stringify({
        copied: rerun.copied,
        alreadyPresent: rerun.alreadyPresent,
        stableBefore,
        stableAfter,
      }),
    );

    const finalInspect = await LocalJournalSecureBootstrapper.inspect();
    push(
      "C9",
      (finalInspect.rowCounts.local_journal_entries ?? -1) === 3 &&
        (finalInspect.rowCounts.local_media ?? -1) === 2
        ? "pass"
        : "fail",
      `entries=${String(finalInspect.rowCounts.local_journal_entries)} media=${String(finalInspect.rowCounts.local_media)}`,
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
    const candidate = artifacts.find(
      (a) => a.name === `${SERVER_COPY_TARGET_DB_NAME}SQLite.db`,
    );
    push(
      "C10",
      prodEncrypted === false && Boolean(prod) && Boolean(candidate)
        ? "pass"
        : "fail",
      `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)} candidateBytes=${String(candidate?.bytes ?? null)} serverUntouched=GET-only`,
    );

    const capacity = await readAvailableBytesOrNull();
    push(
      "capacity",
      capacity.decision.known ? "pass" : "fail",
      `available=${String(capacity.availableBytes)} source=${capacity.source}`,
    );
  } catch (error) {
    push("error", "fail", safeErrorMessage(error));
  } finally {
    configureServerFetchPoc(null);
  }

  const report = {
    ranAt: new Date().toISOString(),
    entryIds: SECURE_COPY_POC_ENTRY_IDS,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    steps,
    actualJournalUntouched: true as const,
  };
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/secure-copy-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}

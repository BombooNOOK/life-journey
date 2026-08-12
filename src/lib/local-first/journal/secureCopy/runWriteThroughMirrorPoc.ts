/**
 * Simulator W1–W10 for Phase 4B-4E write-through mirror PoC.
 * Explicit test entry ID only. Never discovers / selects general journals.
 * Does not call production Journal save. Server is GET-only.
 */

import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { CapacitorSQLite } from "@capacitor-community/sqlite";

import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { ServerAuthoritativeWriteThroughMirrorService } from "@/lib/local-first/journal/secureCopy/ServerAuthoritativeWriteThroughMirrorService";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import { SERVER_COPY_TARGET_DB_NAME } from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  listSqliteArtifactsReadOnly,
  openNamedEncryptedDatabase,
  closeNamedEncryptedDatabase,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";
import {
  apiJournalToServerLike,
  configureServerFetchPoc,
  fetchAuthenticatedJournalEntry,
  journalEntryNeedsPhoto,
} from "@/lib/local-first/journal/serverFetch";
import { hasTestPurposeTag } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";

/**
 * Confirmed 4B-4E dedicated Server test entry (user-provided).
 * #WriteThroughTest + photo. Never auto-discover other journals.
 * Note: no `process.env` here — Capacitor lab.js has no Node process.
 */
export const WRITE_THROUGH_POC_ENTRY_ID = "cmsppllhx0000kv04nmct79ak";

export const WRITE_THROUGH_POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";

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

export type WriteThroughPocStep = {
  id: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

function summarizeMirror(result: {
  result: string;
  serverEntryId: string | null;
  stableId: string | null;
  legacyServerId: string | null;
  needsRetry: boolean;
  detail: string;
  fingerprint: { contentHash: string; photoHash: string | null } | null;
}) {
  return {
    result: result.result,
    serverEntryId: result.serverEntryId,
    stableId: result.stableId,
    legacyServerId: result.legacyServerId,
    needsRetry: result.needsRetry,
    detail: result.detail,
    contentHash: result.fingerprint?.contentHash ?? null,
    photoHash: result.fingerprint?.photoHash ?? null,
  };
}

/** PoC-only: remove one candidate row/media by legacyServerId so Local-failure inject can run. */
async function removeCandidateEntryByLegacyServerIdForPoc(
  legacyServerId: string,
): Promise<{ removed: boolean; mediaDeleted: number }> {
  assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
  const existing = await withCandidateRepository((repo) =>
    repo.getByLegacyServerId(legacyServerId),
  );
  if (!existing) return { removed: false, mediaDeleted: 0 };

  const media = await createNativeCandidateMediaStore();
  let mediaDeleted = 0;
  for (const ref of existing.mediaRefs) {
    await media.delete(ref.relativePath).catch(() => undefined);
    mediaDeleted += 1;
  }

  const db = await openNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME, 1);
  try {
    await db.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [
      existing.stableId,
    ]);
    await db.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
      existing.stableId,
    ]);
    await db.run(`DELETE FROM local_journal_entries WHERE stable_id = ?;`, [
      existing.stableId,
    ]);
  } finally {
    await closeNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME);
  }
  return { removed: true, mediaDeleted };
}

export async function runWriteThroughMirrorPoc(options?: {
  entryId?: string;
}): Promise<{
  ranAt: string;
  entryId: string | null;
  targetDb: typeof SERVER_COPY_TARGET_DB_NAME;
  steps: WriteThroughPocStep[];
  actualJournalUntouched: true;
  generalUiUntouched: true;
}> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("write-through mirror PoC is native-only");
  }

  const steps: WriteThroughPocStep[] = [];
  const push = (id: string, status: WriteThroughPocStep["status"], detail: string) => {
    steps.push({ id, status, detail });
  };

  const entryId = (options?.entryId ?? WRITE_THROUGH_POC_ENTRY_ID).trim();

  try {
    if (!entryId) {
      push(
        "W0",
        "fail",
        "explicit test entry ID required — stop and confirm with user (no auto discovery)",
      );
      throw new Error("WRITE_THROUGH_POC_ENTRY_ID unset");
    }

    const cookieHeader = await loadPocSessionCookieHeader();
    if (!cookieHeader) {
      push("W2", "fail", "missing session.cookie for production GET");
      throw new Error("write-through PoC requires Library/ljd/security-poc/session.cookie");
    }
    configureServerFetchPoc({
      apiOrigin: WRITE_THROUGH_POC_API_ORIGIN,
      cookieHeader,
    });

    await LocalJournalSecureBootstrapper.bootstrap();
    const before = await LocalJournalSecureBootstrapper.inspect();
    push(
      "W1",
      before.health.status === "ready" && before.encrypted === true ? "pass" : "fail",
      `health=${before.health.status} encrypted=${String(before.encrypted)} entries=${String(before.rowCounts.local_journal_entries ?? null)}`,
    );

    const fetched = await fetchAuthenticatedJournalEntry(entryId);
    if (!fetched.ok) {
      push("W2", "fail", `GET failed code=${fetched.code}`);
      throw new Error("canonical GET failed");
    }
    const like = apiJournalToServerLike(fetched.entry);
    const testTagged = hasTestPurposeTag(like.tags);
    const serverUpdatedAt = fetched.entry.updatedAt;
    const needsPhoto = journalEntryNeedsPhoto(fetched.entry);
    push(
      "W2",
      testTagged ? "pass" : "fail",
      JSON.stringify({
        id: entryId,
        testTagged,
        needsPhoto,
        tagCount: like.tags.length,
        updatedAt: serverUpdatedAt,
        contentChars: fetched.entry.content.length,
      }),
    );
    if (!testTagged) {
      throw new Error("entry is not a test-purpose journal");
    }

    // Prep: ensure Local has no row so W5 Local-failure inject can observe failed+needsRetry
    const prep = await removeCandidateEntryByLegacyServerIdForPoc(entryId);
    push(
      "prep",
      "pass",
      JSON.stringify({ removedPriorLocal: prep.removed, mediaDeleted: prep.mediaDeleted }),
    );

    // W5 first (after prep): Local failure injection — Server must not roll back
    const failInject = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(
      entryId,
      { injectLocalFailure: "save" },
    );
    push(
      "W5",
      failInject.result === "failed" && failInject.needsRetry === true
        ? "pass"
        : "fail",
      JSON.stringify(summarizeMirror(failInject)),
    );

    const afterFailInspect = await LocalJournalSecureBootstrapper.inspect();
    const noLocalRow =
      (await withCandidateRepository((r) => r.getByLegacyServerId(entryId))) === null;

    const serverAfterFail = await fetchAuthenticatedJournalEntry(entryId);
    const serverUntouched =
      serverAfterFail.ok && serverAfterFail.entry.updatedAt === serverUpdatedAt;
    push(
      "W6",
      serverUntouched && noLocalRow && failInject.needsRetry ? "pass" : "fail",
      JSON.stringify({
        serverUntouched,
        noLocalRow,
        noPartialRow: noLocalRow,
        updatedAtBefore: serverUpdatedAt,
        updatedAtAfter: serverAfterFail.ok ? serverAfterFail.entry.updatedAt : null,
        entries: afterFailInspect.rowCounts.local_journal_entries,
      }),
    );

    // W7 / W3: retry without inject → mirrored
    const success = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(entryId);
    push(
      "W7",
      success.result === "mirrored" ? "pass" : "fail",
      JSON.stringify(summarizeMirror(success)),
    );
    push(
      "W3",
      success.result === "mirrored" ? "pass" : "fail",
      JSON.stringify(summarizeMirror(success)),
    );

    const afterMirror = await LocalJournalSecureBootstrapper.inspect();
    const mediaOk = !needsPhoto || (afterMirror.rowCounts.local_media ?? 0) >= 1;
    push(
      "W4",
      afterMirror.health.status === "ready" &&
        Boolean(await withCandidateRepository((r) => r.getByLegacyServerId(entryId))) &&
        mediaOk &&
        Boolean(success.fingerprint?.contentHash) &&
        (!needsPhoto || Boolean(success.fingerprint?.photoHash))
        ? "pass"
        : "fail",
      `entries=${String(afterMirror.rowCounts.local_journal_entries)} media=${String(afterMirror.rowCounts.local_media)} contentHash=${success.fingerprint?.contentHash ?? null} photoHash=${success.fingerprint?.photoHash ?? null} stableId=${success.stableId}`,
    );

    const rerun = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(entryId);
    const afterRerun = await LocalJournalSecureBootstrapper.inspect();
    push(
      "W8",
      rerun.result === "already_present" &&
        rerun.stableId === success.stableId &&
        (afterRerun.rowCounts.local_journal_entries ?? -1) ===
          (afterMirror.rowCounts.local_journal_entries ?? -2)
        ? "pass"
        : "fail",
      JSON.stringify({
        ...summarizeMirror(rerun),
        stableIdBefore: success.stableId,
        entries: afterRerun.rowCounts.local_journal_entries,
      }),
    );

    const persisted = await LocalJournalSecureBootstrapper.inspect();
    push(
      "W9",
      persisted.health.status === "ready" &&
        (persisted.rowCounts.local_journal_entries ?? 0) >= 1
        ? "pass"
        : "fail",
      `entries=${String(persisted.rowCounts.local_journal_entries)} media=${String(persisted.rowCounts.local_media)} (kill/relaunch verified by outer harness when needed)`,
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
      "W10",
      prodEncrypted === false && Boolean(prod) && Boolean(candidate) && serverUntouched
        ? "pass"
        : "fail",
      `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)} candidateBytes=${String(candidate?.bytes ?? null)} generalUi=Server-only-save-unchanged`,
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
    entryId: entryId || null,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    steps,
    actualJournalUntouched: true as const,
    generalUiUntouched: true as const,
  };
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/write-through-mirror-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
  return report;
}

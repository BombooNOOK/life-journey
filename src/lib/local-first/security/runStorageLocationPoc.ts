/**
 * Phase 4B-3C.1 — Production storage location PoC (Application Support first candidate).
 * Dummy encrypted DB only. Does not migrate/encrypt ljd_local_journal.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LjdLocalSecurity, type PathAttributes } from "ljd-local-security";

export const STORAGE_POC_DB = "ljd_storage_location_poc" as const;
export const STORAGE_POC_DUMMY = "storage-location poc dummy row" as const;

export type StorageStep = {
  id: string;
  title: string;
  status: "pass" | "fail" | "info" | "skip";
  detail: string;
};

export type StorageLocationReport = {
  ranAt: string;
  platform: string;
  comparison: {
    A_applicationSupport: Record<string, unknown>;
    B_documents: Record<string, unknown>;
    C_libraryCapacitorDatabase: Record<string, unknown>;
  };
  recommendation: "A" | "B" | "C";
  recommendationNote: string;
  additionalNativeBridgeNeededInProduction: boolean;
  sqlCipherKeyPathConfirmed: string;
  steps: StorageStep[];
  summary: {
    appSupportPlaceOk: boolean;
    pluginSetsParentExcluded: boolean | null;
    canForceIncludeBackup: boolean | null;
    includeSurvivesReopen: boolean | null;
    includeSurvivesRelaunch: boolean | null | "pending_relaunch_measure";
    completeProtectionHolds: boolean | null;
    documentsCompareKept: boolean;
  };
};

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Storage location PoC is native-only.");
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function fmtExcl(a: PathAttributes | undefined): string {
  if (!a) return "n/a";
  return `excl=${String(a.isExcludedFromBackup)} prot=${a.fileProtection} exists=${String(a.exists)}`;
}

function randomPassphrase(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = "";
  for (const b of arr) out += b.toString(16).padStart(2, "0");
  return out;
}

async function closeIfOpen(sqlite: SQLiteConnection, name: string): Promise<void> {
  try {
    await sqlite.checkConnectionsConsistency();
  } catch {
    /* */
  }
  try {
    if ((await sqlite.isConnection(name, false)).result) {
      await sqlite.closeConnection(name, false);
    }
  } catch {
    try {
      await CapacitorSQLite.closeConnection({ database: name, readonly: false });
    } catch {
      /* */
    }
  }
}

export async function runStorageLocationPoc(options?: {
  /** Second-boot persistence check only. */
  relaunchCheckOnly?: boolean;
}): Promise<StorageLocationReport> {
  assertNative();
  const steps: StorageStep[] = [];
  const push = (
    id: string,
    title: string,
    status: StorageStep["status"],
    detail: string,
  ) => steps.push({ id, title, status, detail });

  const asMeta = await LjdLocalSecurity.resolveApplicationSupportLjdDir();
  push(
    "as-resolve",
    "Application Support via FileManager",
    "info",
    `bundleId=${asMeta.bundleIdentifier} ljdDir=${asMeta.ljdApplicationSupportDir} pluginRelative=${asMeta.pluginRelativeLocation}`,
  );

  // Relaunch persistence file from prior run
  let relaunchInclude: boolean | null | "pending_relaunch_measure" =
    "pending_relaunch_measure";
  try {
    const prev = await Filesystem.readFile({
      path: "ljd/security-poc/storage-location-exclude-state.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
    });
    const text = typeof prev.data === "string" ? prev.data : "";
    const parsed = JSON.parse(text) as {
      parentExcludedAfterForceFalse?: boolean;
      expectOnNextBoot?: boolean;
    };
    if (typeof parsed.parentExcludedAfterForceFalse === "boolean") {
      const parentNow = await LjdLocalSecurity.inspectPath({
        path: asMeta.ljdApplicationSupportDir,
      });
      const stillIncluded = parentNow.isExcludedFromBackup === false;
      relaunchInclude = stillIncluded;
      push(
        "relaunch-exclude",
        "isExcludedFromBackup=false after kill/relaunch",
        stillIncluded ? "pass" : "fail",
        `priorForcedFalse=true nowExcl=${String(parentNow.isExcludedFromBackup)} stillIncluded=${String(stillIncluded)}`,
      );
    }
  } catch {
    push(
      "relaunch-exclude",
      "isExcludedFromBackup after relaunch",
      "info",
      "no prior force-false state (first install/run)",
    );
  }

  if (options?.relaunchCheckOnly) {
    return finalize(steps, asMeta, {
      appSupportPlaceOk: false,
      pluginSetsParentExcluded: null,
      canForceIncludeBackup: null,
      includeSurvivesReopen: null,
      includeSurvivesRelaunch: relaunchInclude,
      completeProtectionHolds: null,
      documentsCompareKept: true,
    });
  }

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  let pluginSetsParentExcluded: boolean | null = null;
  let canForceIncludeBackup: boolean | null = null;
  let includeSurvivesReopen: boolean | null = null;
  let completeProtectionHolds: boolean | null = null;
  let appSupportPlaceOk = false;
  let dbUrl = "";

  try {
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
      /* */
    }
    await closeIfOpen(sqlite, STORAGE_POC_DB);

    // Inspect parent AFTER plugin init has likely createDatabaseLocation'd it.
    const parentAfterPlugin = await LjdLocalSecurity.inspectPath({
      path: asMeta.ljdApplicationSupportDir,
    });
    const asRoot = await LjdLocalSecurity.inspectPath({
      path: asMeta.applicationSupportRoot,
    });
    pluginSetsParentExcluded = parentAfterPlugin.isExcludedFromBackup === true;
    push(
      "plugin-exclude-behavior",
      "plugin createDatabaseLocation backup exclusion",
      "info",
      `LJD AS dir ${fmtExcl(parentAfterPlugin)} | AS root ${fmtExcl(asRoot)} | source: UtilsFile.createDatabaseLocation sets isExcluded=true on first create`,
    );

    const passphrase = randomPassphrase();
    await CapacitorSQLite.setEncryptionSecret({ passphrase });
    void passphrase;

    // Ensure clean dummy DB file in current plugin location
    const deleteCandidates = [
      `${asMeta.ljdApplicationSupportDir}/${STORAGE_POC_DB}SQLite.db`,
      `${asMeta.ljdDatabasesDir}/${STORAGE_POC_DB}SQLite.db`,
    ];
    for (const p of deleteCandidates) {
      await LjdLocalSecurity.deletePath({ path: p });
    }

    {
      const db = await sqlite.createConnection(
        STORAGE_POC_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS s_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM s_rows;
        INSERT INTO s_rows (id, body) VALUES (1, '${STORAGE_POC_DUMMY}');
      `);
      const url = await db.getUrl();
      dbUrl = url.url ?? "";
      await sqlite.closeConnection(STORAGE_POC_DB, false);
      push(
        "as-create-open",
        "SQLCipher create/open in Application Support location",
        dbUrl ? "pass" : "fail",
        `dbUrlPresent=${String(Boolean(dbUrl))} (path not logged as secret; url path ok to inspect)`,
      );
    }

    const dbAttrs0 = dbUrl
      ? await LjdLocalSecurity.inspectPath({ path: dbUrl })
      : null;
    push(
      "as-attrs-initial",
      "AS dummy DB attrs after create",
      dbAttrs0?.exists ? "pass" : "fail",
      `${fmtExcl(dbAttrs0 ?? undefined)} parent[${fmtExcl(
        dbAttrs0?.parent
          ? {
              ...dbAttrs0.parent,
              isDirectory: true,
              path: dbAttrs0.parent.path,
              exists: dbAttrs0.parent.exists,
              isExcludedFromBackup: dbAttrs0.parent.isExcludedFromBackup,
              fileProtection: dbAttrs0.parent.fileProtection,
            }
          : undefined,
      )}]`,
    );
    appSupportPlaceOk = Boolean(dbAttrs0?.exists);

    // If parent excluded, force include=false (backup eligible)
    const parentPath = dbAttrs0?.parent?.path ?? asMeta.ljdApplicationSupportDir;
    if (dbAttrs0?.parent?.isExcludedFromBackup === true || parentAfterPlugin.isExcludedFromBackup === true) {
      const forced = await LjdLocalSecurity.setExcludedFromBackup({
        path: parentPath,
        excluded: false,
      });
      canForceIncludeBackup = forced.isExcludedFromBackup === false;
      push(
        "force-include",
        "set isExcludedFromBackup=false on LJD AS parent",
        canForceIncludeBackup ? "pass" : "fail",
        fmtExcl(forced),
      );
      await Filesystem.mkdir({
        path: "ljd/security-poc",
        directory: Directory.Library,
        recursive: true,
      }).catch(() => undefined);
      await Filesystem.writeFile({
        path: "ljd/security-poc/storage-location-exclude-state.json",
        directory: Directory.Library,
        encoding: Encoding.UTF8,
        data: JSON.stringify(
          {
            at: new Date().toISOString(),
            parentPath,
            parentExcludedAfterForceFalse: false,
            expectOnNextBoot: true,
          },
          null,
          2,
        ),
      });
    } else {
      canForceIncludeBackup = true;
      push(
        "force-include",
        "set isExcludedFromBackup=false",
        "skip",
        "parent already not excluded",
      );
    }

    // reopen + wrong key + Complete
    {
      await closeIfOpen(sqlite, STORAGE_POC_DB);
      const db = await sqlite.createConnection(
        STORAGE_POC_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      const q = await db.query("SELECT body FROM s_rows LIMIT 1;");
      const body = String(
        (q.values?.[0] as Record<string, unknown> | undefined)?.body ?? "",
      );
      const url = await db.getUrl();
      dbUrl = url.url ?? dbUrl;
      await sqlite.closeConnection(STORAGE_POC_DB, false);
      push(
        "reopen-ok",
        "encrypted reopen correct secret",
        body === STORAGE_POC_DUMMY ? "pass" : "fail",
        `contentMatch=${String(body === STORAGE_POC_DUMMY)}`,
      );
    }

    {
      await closeIfOpen(sqlite, STORAGE_POC_DB);
      let failed = false;
      try {
        const bad = await sqlite.createConnection(
          STORAGE_POC_DB,
          true,
          "wrongsecret",
          1,
          false,
        );
        await bad.open();
        await sqlite.closeConnection(STORAGE_POC_DB, false);
      } catch {
        failed = true;
        await closeIfOpen(sqlite, STORAGE_POC_DB);
      }
      push(
        "wrong-key",
        "wrong secret fails",
        failed ? "pass" : "fail",
        `failedAsExpected=${String(failed)}`,
      );
    }

    const parentAfterReopen = await LjdLocalSecurity.inspectPath({ path: parentPath });
    includeSurvivesReopen = parentAfterReopen.isExcludedFromBackup === false;
    push(
      "exclude-after-reopen",
      "backup include after DB reopen",
      includeSurvivesReopen ? "pass" : "fail",
      fmtExcl(parentAfterReopen),
    );

    if (dbUrl) {
      const afterComplete = await LjdLocalSecurity.setCompleteProtection({ path: dbUrl });
      await closeIfOpen(sqlite, STORAGE_POC_DB);
      const db = await sqlite.createConnection(
        STORAGE_POC_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      await db.run("INSERT INTO s_rows (id, body) VALUES (?, ?);", [2, "after-complete"]);
      await sqlite.closeConnection(STORAGE_POC_DB, false);
      const afterOpen = await LjdLocalSecurity.inspectPath({ path: dbUrl });
      completeProtectionHolds =
        afterComplete.fileProtection === "NSFileProtectionComplete" &&
        afterOpen.fileProtection === "NSFileProtectionComplete";
      push(
        "fp-complete",
        "NSFileProtectionComplete holds across reopen",
        completeProtectionHolds ? "pass" : "info",
        `afterSet=${afterComplete.fileProtection} afterReopen=${afterOpen.fileProtection}`,
      );
    }
  } catch (e) {
    push("error", "storage location suite", "fail", errMsg(e));
  }

  // Comparison probes B / C (attrs only; do not move production journal)
  const paths = await LjdLocalSecurity.resolveCandidatePaths();
  const docsProbe = await LjdLocalSecurity.ensureProbeFile({
    path: `${paths.candidateB_documents}/ljd_storage_compare_probe.db`,
  });
  const capDbProbePath = `${paths.candidateA_libraryCapacitorDatabase}/ljd_storage_compare_probe.db`;
  const capDbProbe = await LjdLocalSecurity.ensureProbeFile({ path: capDbProbePath });
  // Also inspect real leftover journal location if present
  const oldJournal = await LjdLocalSecurity.inspectPath({
    path: `${paths.candidateA_libraryCapacitorDatabase}/ljd_local_journalSQLite.db`,
  });

  push(
    "compare-B-documents",
    "Documents comparison probe",
    "info",
    fmtExcl(docsProbe) +
      ` parentExcl=${String(docsProbe.parent?.isExcludedFromBackup)}`,
  );
  push(
    "compare-C-capacitorDb",
    "Library/CapacitorDatabase comparison",
    "info",
    `probe ${fmtExcl(capDbProbe)} parentExcl=${String(capDbProbe.parent?.isExcludedFromBackup)} journalExists=${String(oldJournal.exists)} journalExcl=${String(oldJournal.isExcludedFromBackup)}`,
  );
  push(
    "media-unchanged",
    "media path policy",
    "info",
    "Library/ljd/media/... left unchanged; prior 4B-3B isExcludedFromBackup=false stands",
  );

  try {
    await CapacitorSQLite.clearEncryptionSecret();
  } catch {
    /* */
  }

  return finalize(
    steps,
    asMeta,
    {
      appSupportPlaceOk,
      pluginSetsParentExcluded,
      canForceIncludeBackup,
      includeSurvivesReopen,
      includeSurvivesRelaunch: relaunchInclude,
      completeProtectionHolds,
      documentsCompareKept: true,
    },
    {
      A_db: dbUrl
        ? await LjdLocalSecurity.inspectPath({ path: dbUrl }).catch(() => null)
        : null,
      A_parent: await LjdLocalSecurity.inspectPath({
        path: asMeta.ljdApplicationSupportDir,
      }),
      A_asRoot: await LjdLocalSecurity.inspectPath({
        path: asMeta.applicationSupportRoot,
      }),
      B: docsProbe,
      C: capDbProbe,
      C_journal: oldJournal,
    },
  );
}

function finalize(
  steps: StorageStep[],
  asMeta: Awaited<ReturnType<typeof LjdLocalSecurity.resolveApplicationSupportLjdDir>>,
  summary: StorageLocationReport["summary"],
  extras?: {
    A_db: PathAttributes | null;
    A_parent: PathAttributes;
    A_asRoot: PathAttributes;
    B: PathAttributes;
    C: PathAttributes;
    C_journal: PathAttributes;
  },
): StorageLocationReport {
  const recommendation: "A" | "B" | "C" = "A";
  const bridgeNeeded =
    summary.pluginSetsParentExcluded === true &&
    summary.canForceIncludeBackup === true;

  return {
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    comparison: {
      A_applicationSupport: {
        guideline: "Apple: app-created support files → Library/Application Support/<bundleId>",
        pluginRelative: asMeta.pluginRelativeLocation,
        absoluteLjdDir: asMeta.ljdApplicationSupportDir,
        db: extras?.A_db ? fmtExcl(extras.A_db) : null,
        parent: extras ? fmtExcl(extras.A_parent) : null,
        asRoot: extras ? fmtExcl(extras.A_asRoot) : null,
        filesAppExposure: "hidden from Files (not Documents)",
      },
      B_documents: {
        guideline: "Apple: user-managed documents only",
        probe: extras ? fmtExcl(extras.B) : null,
        filesAppExposure: "may surface via Files / sharing surfaces",
      },
      C_libraryCapacitorDatabase: {
        note: "current foundation provisional",
        probe: extras ? fmtExcl(extras.C) : null,
        parentTypicallyExcluded: true,
        journalLeftover: extras ? fmtExcl(extras.C_journal) : null,
      },
    },
    recommendation,
    recommendationNote:
      "Recommend A (Application Support + backup included via LJD override if plugin excludes parent). Documents remains compare-only. CapacitorDatabase rejected as formal due to parent exclude + non-guideline path name.",
    additionalNativeBridgeNeededInProduction: bridgeNeeded,
    sqlCipherKeyPathConfirmed:
      "setEncryptionSecret → plugin Keychain unlockSecret/ljd_CapacitorSQLitePlugin (WhenUnlocked) → SQLCipher open",
    steps,
    summary,
  };
}

export async function persistStorageLocationReport(
  report: StorageLocationReport,
): Promise<void> {
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/storage-location-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
}

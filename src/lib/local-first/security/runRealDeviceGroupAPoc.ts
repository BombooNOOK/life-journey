/**
 * Phase 4B-3D Group A — non-destructive real-device measurements.
 * Dummy DB / dummy media only. Never touches ljd_local_journal content migration.
 * Never erase / restore / uninstall. Do not autorun.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LjdLocalSecurity, type PathAttributes } from "ljd-local-security";

export const REAL_DEVICE_GROUP_A_DB = "ljd_real_device_group_a_poc" as const;
export const REAL_DEVICE_GROUP_A_MEDIA = "ljd/media/real-device-group-a" as const;
export const REAL_DEVICE_GROUP_A_TEXT = "real-device Group A dummy journal text" as const;

export type GroupAStep = {
  id: string;
  title: string;
  status: "pass" | "fail" | "info" | "skip";
  detail: string;
};

export type GroupAReport = {
  ranAt: string;
  platform: string;
  deviceClass: "real_device_expected";
  destructiveOps: "forbidden";
  simulatorNote: string;
  steps: GroupAStep[];
  summary: {
    dbLocationOk: boolean;
    backupIncludeOk: boolean | null;
    completeProtectionOk: boolean | null;
    keychainWhenUnlocked: boolean | null;
    mediaReadOk: boolean;
    encryptedReopenOk: boolean;
    lockTest: "not_run_in_this_suite" | "inconclusive" | "pass" | "fail";
  };
};

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Group A PoC is native-only.");
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function fmt(a: PathAttributes | undefined): string {
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

/**
 * Non-destructive Group A suite for company test device.
 * Does not clear production journal; does not uninstall; secrets never logged.
 */
export async function runRealDeviceGroupAPoc(): Promise<GroupAReport> {
  assertNative();
  const steps: GroupAStep[] = [];
  const push = (
    id: string,
    title: string,
    status: GroupAStep["status"],
    detail: string,
  ) => steps.push({ id, title, status, detail });

  push(
    "policy",
    "device policy",
    "info",
    "Group A only: no erase/restore/uninstall/journal wipe. Dummy DB/media only. Personal everyday phone excluded.",
  );

  const asMeta = await LjdLocalSecurity.resolveApplicationSupportLjdDir();
  push(
    "as-resolve",
    "Application Support resolve",
    "info",
    `bundleId=${asMeta.bundleIdentifier} ljdDir=${asMeta.ljdApplicationSupportDir}`,
  );

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  let dbLocationOk = false;
  let backupIncludeOk: boolean | null = null;
  let completeProtectionOk: boolean | null = null;
  let keychainWhenUnlocked: boolean | null = null;
  let mediaReadOk = false;
  let encryptedReopenOk = false;
  let dbUrl = "";

  try {
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
      /* */
    }
    await closeIfOpen(sqlite, REAL_DEVICE_GROUP_A_DB);
    await LjdLocalSecurity.deletePath({
      path: `${asMeta.ljdApplicationSupportDir}/${REAL_DEVICE_GROUP_A_DB}SQLite.db`,
    });

    // Counter plugin first-create exclusion if present
    const parent0 = await LjdLocalSecurity.inspectPath({
      path: asMeta.ljdApplicationSupportDir,
    });
    if (parent0.isExcludedFromBackup === true) {
      await LjdLocalSecurity.setExcludedFromBackup({
        path: asMeta.ljdApplicationSupportDir,
        excluded: false,
      });
    }

    const passphrase = randomPassphrase();
    await CapacitorSQLite.setEncryptionSecret({ passphrase });
    void passphrase;

    {
      const db = await sqlite.createConnection(
        REAL_DEVICE_GROUP_A_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS g_rows (
          id INTEGER PRIMARY KEY NOT NULL,
          body TEXT NOT NULL
        );
        DELETE FROM g_rows;
        INSERT INTO g_rows (id, body) VALUES (1, '${REAL_DEVICE_GROUP_A_TEXT}');
      `);
      dbUrl = (await db.getUrl()).url ?? "";
      await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
      dbLocationOk = Boolean(dbUrl);
      push(
        "A2-db",
        "dummy encrypted DB create",
        dbLocationOk ? "pass" : "fail",
        `dbUrlPresent=${String(dbLocationOk)}`,
      );
    }

    const parent = await LjdLocalSecurity.inspectPath({
      path: asMeta.ljdApplicationSupportDir,
    });
    const dbAttrs = dbUrl
      ? await LjdLocalSecurity.inspectPath({ path: dbUrl })
      : undefined;
    backupIncludeOk =
      parent.isExcludedFromBackup === false &&
      (dbAttrs?.isExcludedFromBackup === false ||
        dbAttrs?.isExcludedFromBackup === "unset");
    push(
      "A3-backup",
      "backup exclusion measure",
      backupIncludeOk ? "pass" : "info",
      `db=${fmt(dbAttrs)} parent=${fmt(parent)}`,
    );

    if (dbUrl) {
      const after = await LjdLocalSecurity.setCompleteProtection({ path: dbUrl });
      await closeIfOpen(sqlite, REAL_DEVICE_GROUP_A_DB);
      const db = await sqlite.createConnection(
        REAL_DEVICE_GROUP_A_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      const q = await db.query("SELECT body FROM g_rows LIMIT 1;");
      const body = String(
        (q.values?.[0] as Record<string, unknown> | undefined)?.body ?? "",
      );
      await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
      const afterOpen = await LjdLocalSecurity.inspectPath({ path: dbUrl });
      encryptedReopenOk = body === REAL_DEVICE_GROUP_A_TEXT;
      completeProtectionOk =
        after.fileProtection === "NSFileProtectionComplete" &&
        afterOpen.fileProtection === "NSFileProtectionComplete";
      push(
        "A3-fp",
        "file protection Complete",
        completeProtectionOk ? "pass" : "info",
        `afterSet=${after.fileProtection} afterReopen=${afterOpen.fileProtection}`,
      );
      push(
        "A7-reopen",
        "encrypted reopen (session)",
        encryptedReopenOk ? "pass" : "fail",
        `contentMatch=${String(encryptedReopenOk)}`,
      );
    }

    const kc = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: "unlockSecret",
      account: "ljd_CapacitorSQLitePlugin",
    });
    keychainWhenUnlocked =
      kc.found && kc.accessibility === "kSecAttrAccessibleWhenUnlocked";
    push(
      "A3-keychain",
      "plugin Keychain accessibility (no secret read)",
      keychainWhenUnlocked ? "pass" : "fail",
      `found=${String(kc.found)} accessibility=${kc.accessibility ?? "null"} returnedSecretData=${String(kc.returnedSecretData ?? false)}`,
    );

    // dummy 1x1 png under Library media path (distinct from production journal media)
    await Filesystem.mkdir({
      path: REAL_DEVICE_GROUP_A_MEDIA,
      directory: Directory.Library,
      recursive: true,
    }).catch(() => undefined);
    const tinyPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
    await Filesystem.writeFile({
      path: mediaRel,
      data: tinyPng,
      directory: Directory.Library,
    });
    const uri = await Filesystem.getUri({
      path: mediaRel,
      directory: Directory.Library,
    });
    const mediaAttrs = await LjdLocalSecurity.inspectPath({ path: uri.uri });
    await LjdLocalSecurity.setCompleteProtection({ path: uri.uri });
    const readBack = await Filesystem.readFile({
      path: mediaRel,
      directory: Directory.Library,
    });
    mediaReadOk = typeof readBack.data === "string" && readBack.data.length > 0;
    push(
      "A2-media",
      "dummy media write/read + attrs",
      mediaReadOk ? "pass" : "fail",
      `${fmt(mediaAttrs)} readOk=${String(mediaReadOk)}`,
    );

    push(
      "A6-lock",
      "lock-state access",
      "skip",
      "not_run_in_this_suite — requires user-operated device lock + separate native probe while locked; do not invent PASS",
    );
    push(
      "A8-reboot",
      "reboot test",
      "skip",
      "user-operated: after reboot+unlock, re-run Group A reopen / Keychain exists check. No erase.",
    );
  } catch (e) {
    push("error", "Group A suite", "fail", errMsg(e));
  }

  // Leave plugin secret for kill/relaunch Keychain+DB check on same install.
  // Caller may clear later; do not wipe production journals.
  push(
    "cleanup-note",
    "cleanup policy",
    "info",
    "dummy DB/media left for kill/relaunch observe; production journal untouched; secret value never logged",
  );

  return {
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    deviceClass: "real_device_expected",
    destructiveOps: "forbidden",
    simulatorNote:
      "Do not merge these numbers into Simulator section of 4B-3D docs until confirmed on company device.",
    steps,
    summary: {
      dbLocationOk,
      backupIncludeOk,
      completeProtectionOk,
      keychainWhenUnlocked,
      mediaReadOk,
      encryptedReopenOk,
      lockTest: "not_run_in_this_suite",
    },
  };
}

export async function persistGroupAReport(report: GroupAReport): Promise<void> {
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/real-device-group-a-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
}

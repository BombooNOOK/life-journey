/**
 * Phase 4B-3D Group A persistence — open existing dummy DB without wipe.
 * Non-destructive. No clearEncryptionSecret / no delete DB / no journal touch.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LjdLocalSecurity } from "ljd-local-security";

import {
  REAL_DEVICE_GROUP_A_DB,
  REAL_DEVICE_GROUP_A_MEDIA,
  REAL_DEVICE_GROUP_A_TEXT,
} from "@/lib/local-first/security/runRealDeviceGroupAPoc";

export type PersistenceReport = {
  ranAt: string;
  platform: string;
  secretDisplayed: false;
  steps: Array<{
    id: string;
    status: "pass" | "fail" | "info" | "skip";
    detail: string;
  }>;
  summary: {
    keychainExists: boolean;
    keychainWhenUnlocked: boolean | null;
    encryptedReopenOk: boolean;
    mediaReadOk: boolean;
  };
};

export async function runGroupAPersistenceCheck(): Promise<PersistenceReport> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("persistence check is native-only");
  }
  const steps: PersistenceReport["steps"] = [];
  const push = (
    id: string,
    status: PersistenceReport["steps"][0]["status"],
    detail: string,
  ) => steps.push({ id, status, detail });

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  let keychainExists = false;
  let keychainWhenUnlocked: boolean | null = null;
  let encryptedReopenOk = false;
  let mediaReadOk = false;

  try {
    const kc = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: "unlockSecret",
      account: "ljd_CapacitorSQLitePlugin",
    });
    keychainExists = kc.found;
    keychainWhenUnlocked =
      kc.found && kc.accessibility === "kSecAttrAccessibleWhenUnlocked";
    push(
      "kc",
      keychainWhenUnlocked ? "pass" : "fail",
      `found=${String(kc.found)} accessibility=${kc.accessibility ?? "null"} secretRead=false`,
    );

    try {
      const consistency = await sqlite.checkConnectionsConsistency();
      void consistency;
      const isConn = (await sqlite.isConnection(REAL_DEVICE_GROUP_A_DB, false))
        .result;
      if (isConn) await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
    } catch {
      /* */
    }

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
    encryptedReopenOk = body === REAL_DEVICE_GROUP_A_TEXT;
    push(
      "db-reopen",
      encryptedReopenOk ? "pass" : "fail",
      `contentMatch=${String(encryptedReopenOk)} (same dummy DB; no wipe)`,
    );
  } catch (e) {
    push("db-reopen", "fail", e instanceof Error ? e.message : String(e));
  }

  try {
    const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
    const readBack = await Filesystem.readFile({
      path: mediaRel,
      directory: Directory.Library,
    });
    mediaReadOk = typeof readBack.data === "string" && readBack.data.length > 0;
    push("media", mediaReadOk ? "pass" : "fail", `readOk=${String(mediaReadOk)}`);
  } catch (e) {
    push("media", "fail", e instanceof Error ? e.message : String(e));
  }

  return {
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    secretDisplayed: false,
    steps,
    summary: {
      keychainExists,
      keychainWhenUnlocked,
      encryptedReopenOk,
      mediaReadOk,
    },
  };
}

export async function persistGroupAPersistenceReport(
  report: PersistenceReport,
): Promise<void> {
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  await Filesystem.writeFile({
    path: "ljd/security-poc/real-device-group-a-persistence.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
}

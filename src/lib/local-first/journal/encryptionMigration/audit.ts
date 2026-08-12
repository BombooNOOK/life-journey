import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";
import { Directory, Filesystem } from "@capacitor/filesystem";

import {
  closeNamedJournalDatabase,
  inventorySafeCounts,
  openNamedPlaintextJournalDatabase,
} from "@/lib/local-first/journal/encryptionMigration/auditHelpers";
import { inventoryJournalTables } from "@/lib/local-first/journal/encryptionMigration/fingerprint";
import { ENC_MIG_FIXTURE_MARKER } from "@/lib/local-first/journal/encryptionMigration/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { resolveLjdApplicationSupportDir } from "@/lib/local-first/security";

export type LocalJournalAudit = {
  dbName: typeof LOCAL_JOURNAL_DB_NAME;
  exists: boolean;
  looksPlaintextHeader: boolean | null;
  encryptedPluginFlag: boolean | null;
  locationRelative: string;
  userVersion: number | null;
  tables: string[];
  rowCounts: Record<string, number>;
  mediaRefsCount: number;
  looksLikeRealUserData: boolean;
  safeForMigrationTest: boolean;
  note: string;
};

export async function auditActualLocalJournal(): Promise<LocalJournalAudit> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("journal audit is native-only");
  }
  const asDir = await resolveLjdApplicationSupportDir();
  const relative = `${asDir.pluginRelativeLocation}/${LOCAL_JOURNAL_DB_NAME}SQLite.db`;
  let encryptedPluginFlag: boolean | null = null;
  try {
    encryptedPluginFlag = Boolean(
      (await CapacitorSQLite.isDatabaseEncrypted({ database: LOCAL_JOURNAL_DB_NAME }))
        .result,
    );
  } catch {
    encryptedPluginFlag = null;
  }

  let exists = false;
  try {
    const db = await openNamedPlaintextJournalDatabase(LOCAL_JOURNAL_DB_NAME);
    exists = true;
    const inventory = await inventoryJournalTables(db);
    const { looksLikeRealUserData, fixtureLikeCount } = await inventorySafeCounts(db);
    await closeNamedJournalDatabase(LOCAL_JOURNAL_DB_NAME);
    const mediaRefsCount = inventory.rowCounts.local_media ?? 0;
    const safeForMigrationTest = !looksLikeRealUserData;
    return {
      dbName: LOCAL_JOURNAL_DB_NAME,
      exists,
      looksPlaintextHeader: encryptedPluginFlag === false ? true : null,
      encryptedPluginFlag,
      locationRelative: relative,
      userVersion: inventory.userVersion,
      tables: inventory.tables,
      rowCounts: inventory.rowCounts,
      mediaRefsCount,
      looksLikeRealUserData,
      safeForMigrationTest,
      note: looksLikeRealUserData
        ? "possible real rows present — do not use this DB as migration source"
        : fixtureLikeCount > 0
          ? "fixture-like rows only or empty; still do not encrypt this file in 4B-3F"
          : "empty or schema-only; 4B-3F uses a separate fixture DB",
    };
  } catch (e) {
    return {
      dbName: LOCAL_JOURNAL_DB_NAME,
      exists,
      looksPlaintextHeader: null,
      encryptedPluginFlag,
      locationRelative: relative,
      userVersion: null,
      tables: [],
      rowCounts: {},
      mediaRefsCount: 0,
      looksLikeRealUserData: false,
      safeForMigrationTest: true,
      note: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function mediaRefsExist(
  relativePaths: string[],
): Promise<{ path: string; exists: boolean }[]> {
  const out: { path: string; exists: boolean }[] = [];
  for (const path of relativePaths) {
    try {
      await Filesystem.stat({ path, directory: Directory.Library });
      out.push({ path, exists: true });
    } catch {
      out.push({ path, exists: false });
    }
  }
  return out;
}

export { ENC_MIG_FIXTURE_MARKER };

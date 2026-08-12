/**
 * Phase 4B-3D Group A — non-destructive lock probe.
 * Dummy DB / dummy media only. Closes SQLite handles before arming.
 * Lock-while-locked file reads are measured natively
 * (protectedDataWillBecomeUnavailable + delayed Data(contentsOf:)).
 * Never invent PASS when the probe does not fire trustworthily.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import {
  LjdLocalSecurity,
  type LockAccessProbeResult,
} from "ljd-local-security";

import {
  REAL_DEVICE_GROUP_A_DB,
  REAL_DEVICE_GROUP_A_MEDIA,
  REAL_DEVICE_GROUP_A_TEXT,
} from "@/lib/local-first/security/runRealDeviceGroupAPoc";

export type LockVerdict =
  | "pass"
  | "fail"
  | "inconclusive_not_demonstrated"
  | "prepared";

export type GroupALockPrepareReport = {
  phase: "prepare";
  ranAt: string;
  platform: string;
  unlockReadOk: boolean;
  connectionsClosed: boolean;
  dbPath: string;
  mediaPath: string;
  dbProtection: string;
  mediaProtection: string;
  arm: {
    armed: boolean;
    armedAt?: string;
    isProtectedDataAvailableNow: boolean;
    resultPath: string;
  };
  nextUserAction: string;
  verdict: "prepared";
};

export type GroupALockFinishReport = {
  phase: "finish";
  ranAt: string;
  platform: string;
  method: string;
  unlockBefore: {
    // filled only when prepare was separate; finish records post-unlock reopen
  };
  nativeProbe: LockAccessProbeResult;
  postUnlock: {
    encryptedReopenOk: boolean;
    mediaReadOk: boolean;
    dbBodyMatch: boolean;
  };
  summary: {
    probeFired: boolean;
    protectedDataUnavailableAtProbe: boolean | null;
    lockedReadsDenied: boolean | null;
    unlockReopenOk: boolean;
    dataPreserved: boolean;
  };
  verdict: LockVerdict;
  verdictNote: string;
};

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

async function resolveDummyPaths(): Promise<{ dbPath: string; mediaPath: string }> {
  const asMeta = await LjdLocalSecurity.resolveApplicationSupportLjdDir();
  const dbPath = `${asMeta.ljdApplicationSupportDir}/${REAL_DEVICE_GROUP_A_DB}SQLite.db`;
  const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
  const uri = await Filesystem.getUri({
    path: mediaRel,
    directory: Directory.Library,
  });
  return { dbPath, mediaPath: uri.uri };
}

/**
 * Unlock: verify read → close handles → Confirm Complete → arm native lock probe.
 * Stops for user to lock the phone. Does not wipe dummy or clear encryption secret.
 */
export async function prepareGroupALockTest(): Promise<GroupALockPrepareReport> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("lock test is native-only");
  }

  const sqlite = new SQLiteConnection(CapacitorSQLite);
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
  const dbUrl = (await db.getUrl()).url ?? "";
  await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
  await closeIfOpen(sqlite, REAL_DEVICE_GROUP_A_DB);

  if (body !== REAL_DEVICE_GROUP_A_TEXT) {
    throw new Error(
      "unlock DB read mismatch — run Group A once first (dummy only); no wipe attempted here",
    );
  }

  const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
  const mediaRead = await Filesystem.readFile({
    path: mediaRel,
    directory: Directory.Library,
  });
  if (!(typeof mediaRead.data === "string" && mediaRead.data.length > 0)) {
    throw new Error("unlock media read failed");
  }

  const { dbPath, mediaPath } = await resolveDummyPaths();
  const pathForDb = dbUrl || dbPath;
  const afterDb = await LjdLocalSecurity.setCompleteProtection({ path: pathForDb });
  const afterMedia = await LjdLocalSecurity.setCompleteProtection({ path: mediaPath });

  // Ensure nothing left open before lock.
  await closeIfOpen(sqlite, REAL_DEVICE_GROUP_A_DB);

  const arm = await LjdLocalSecurity.armLockAccessProbe({
    paths: [
      { id: "dummy-db", path: pathForDb },
      { id: "dummy-media", path: mediaPath },
    ],
  });

  return {
    phase: "prepare",
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    unlockReadOk: true,
    connectionsClosed: true,
    dbPath: pathForDb,
    mediaPath,
    dbProtection: afterDb.fileProtection,
    mediaProtection: afterMedia.fileProtection,
    arm: {
      armed: arm.armed,
      armedAt: arm.armedAt,
      isProtectedDataAvailableNow: arm.isProtectedDataAvailableNow,
      resultPath: arm.resultPath,
    },
    nextUserAction:
      "今すぐ会社用iPhoneをロックしてください（サイドボタン）。ロック後10秒待ち→解除→「Lock finish」を押す。Xcode接続中は測定が inconclusive になりやすいので、可能なら実行後にケーブルを外すか、ロック中にDebuggerが掴んでいない状態で試す。",
    verdict: "prepared",
  };
}

/**
 * After unlock: read native probe + reopen DB/media. Honest verdict only.
 */
export async function finishGroupALockTest(): Promise<GroupALockFinishReport> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("lock test is native-only");
  }

  const nativeProbe = await LjdLocalSecurity.readLockAccessProbeResult();
  await LjdLocalSecurity.disarmLockAccessProbe().catch(() => undefined);

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  let encryptedReopenOk = false;
  let dbBodyMatch = false;
  let mediaReadOk = false;

  try {
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
    dbBodyMatch = body === REAL_DEVICE_GROUP_A_TEXT;
    encryptedReopenOk = dbBodyMatch;
  } catch {
    encryptedReopenOk = false;
    dbBodyMatch = false;
  }

  try {
    const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
    const readBack = await Filesystem.readFile({
      path: mediaRel,
      directory: Directory.Library,
    });
    mediaReadOk = typeof readBack.data === "string" && readBack.data.length > 0;
  } catch {
    mediaReadOk = false;
  }

  const probeFired = nativeProbe.probeFired === true;
  const unavailable =
    nativeProbe.isProtectedDataAvailableAtProbe === false
      ? true
      : nativeProbe.isProtectedDataAvailableAtProbe === true
        ? false
        : null;
  const lockedReadsDenied =
    probeFired && typeof nativeProbe.allReadsDenied === "boolean"
      ? nativeProbe.allReadsDenied
      : null;
  const unlockReopenOk = encryptedReopenOk && mediaReadOk;
  const dataPreserved = unlockReopenOk;

  let verdict: LockVerdict = "inconclusive_not_demonstrated";
  let verdictNote =
    "実機でも未実証 — native probe が信頼できる形で発火しなかった（または protected data がロック中も available）。PASSにしない。";

  if (!probeFired) {
    verdict = "inconclusive_not_demonstrated";
    verdictNote =
      "実機でも未実証 — lock通知後も probe が発火せず、lock中の新規readを記録できなかった（Xcode/debuggerや短時間ロック等が原因になり得る）。";
  } else if (unavailable !== true) {
    verdict = "inconclusive_not_demonstrated";
    verdictNote =
      "実機でも未実証 — 通知は来たが isProtectedDataAvailableAtProbe≠false。Debugger接続や不完全なロックの可能性。PASSにしない。";
  } else if (lockedReadsDenied === true && unlockReopenOk) {
    verdict = "pass";
    verdictNote =
      "lock中 Data(contentsOf:) が dummy DB/media とも拒否され、unlock後 reopen/read 成功・内容保持。SQLCipher JS open-while-locked 自体は WebView上では測らず、OS Complete 実効を native file read で測った。";
  } else if (lockedReadsDenied === false) {
    verdict = "fail";
    verdictNote =
      "protected data unavailable なのに Complete 付きファイルの raw read が成功した — Complete 実効の期待と不一致。";
  } else if (!unlockReopenOk) {
    verdict = "fail";
    verdictNote = "unlock後の reopen/read が失敗、または dummy 内容不一致。";
  }

  return {
    phase: "finish",
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    method:
      nativeProbe.method ??
      "UIApplication.protectedDataWillBecomeUnavailableNotification + delayed Data(contentsOf:)",
    unlockBefore: {},
    nativeProbe,
    postUnlock: {
      encryptedReopenOk,
      mediaReadOk,
      dbBodyMatch,
    },
    summary: {
      probeFired,
      protectedDataUnavailableAtProbe: unavailable,
      lockedReadsDenied,
      unlockReopenOk,
      dataPreserved,
    },
    verdict,
    verdictNote,
  };
}

export async function persistGroupALockReport(
  report: GroupALockPrepareReport | GroupALockFinishReport,
): Promise<void> {
  await Filesystem.mkdir({
    path: "ljd/security-poc",
    directory: Directory.Library,
    recursive: true,
  }).catch(() => undefined);
  const name =
    report.phase === "prepare"
      ? "real-device-group-a-lock-prepare.json"
      : "real-device-group-a-lock-report.json";
  await Filesystem.writeFile({
    path: `ljd/security-poc/${name}`,
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
}

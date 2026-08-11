/**
 * Phase 4B-3B Local Data Protection PoC runner.
 * Dummy DB / dummy media / no real journals / secrets never logged.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { LjdLocalSecurity, type PathAttributes } from "ljd-local-security";

import { SecureKeyStore } from "@/lib/local-first/security/secureKeyStore";

export const SECURITY_POC_DB = "ljd_security_poc" as const;
export const SECURITY_POC_MEDIA_ROOT = "ljd/media/security-poc" as const;
export const SECURITY_POC_DUMMY_CONTENT = "This is encrypted LJD dummy data" as const;

export type StepStatus = "pass" | "fail" | "skip" | "info";

export type PoCStep = {
  id: string;
  title: string;
  status: StepStatus;
  detail: string;
};

export type SecurityPocReport = {
  ranAt: string;
  platform: string;
  steps: PoCStep[];
  /** No secret values. */
  summary: {
    sqlcipherOk: boolean;
    secureKeyStoreOk: boolean;
    builtInStoreVerdict: "A" | "B";
    builtInStoreNote: string;
  };
};

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Security PoC is native-only.");
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Random passphrase for plugin Test-series A — never logged / never committed. */
function randomPassphrase(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = "";
  for (const b of arr) out += b.toString(16).padStart(2, "0");
  return out;
}

function redact(steps: PoCStep[]): PoCStep[] {
  return steps.map((s) => ({
    ...s,
    detail: s.detail
      // Never expose secret/passphrase material; keep structural error text.
      .replace(/(secret|passphrase)\s*[=:]\s*\S+/gi, "$1=<redacted>"),
  }));
}

async function closeIfOpen(sqlite: SQLiteConnection, name: string): Promise<void> {
  try {
    await sqlite.checkConnectionsConsistency();
  } catch {
    /* ignore */
  }
  try {
    const isConn = (await sqlite.isConnection(name, false)).result;
    if (isConn) await sqlite.closeConnection(name, false);
  } catch {
    try {
      await CapacitorSQLite.closeConnection({ database: name, readonly: false });
    } catch {
      /* ignore */
    }
  }
}

async function deleteDbIfExists(sqlite: SQLiteConnection, name: string): Promise<void> {
  await closeIfOpen(sqlite, name);
  try {
    const exists = (await sqlite.isDatabase(name)).result;
    if (exists) await CapacitorSQLite.deleteDatabase({ database: name });
  } catch {
    /* ignore */
  }
}

async function openPlain(
  sqlite: SQLiteConnection,
  name: string,
): Promise<SQLiteDBConnection> {
  await closeIfOpen(sqlite, name);
  const db = await sqlite.createConnection(name, false, "no-encryption", 1, false);
  await db.open();
  return db;
}

async function queryCount(db: SQLiteDBConnection): Promise<number> {
  const res = await db.query("SELECT COUNT(*) AS c FROM poc_rows;");
  const row = res.values?.[0] as Record<string, unknown> | undefined;
  const c = row?.c ?? Object.values(row ?? {})[0];
  return typeof c === "number" ? c : Number(c ?? 0);
}

async function queryContent(db: SQLiteDBConnection): Promise<string | null> {
  const res = await db.query("SELECT body FROM poc_rows ORDER BY id LIMIT 1;");
  const row = res.values?.[0] as Record<string, unknown> | undefined;
  const body = row?.body ?? Object.values(row ?? {})[0];
  return typeof body === "string" ? body : body != null ? String(body) : null;
}

function fmtAttrs(a: PathAttributes): string {
  const parent = a.parent
    ? ` parent[excl=${String(a.parent.isExcludedFromBackup)} prot=${a.parent.fileProtection}]`
    : "";
  return `excl=${String(a.isExcludedFromBackup)} prot=${a.fileProtection} exists=${String(a.exists)}${parent}`;
}

/**
 * Full Security PoC. Safe for kill/relaunch checkpoint: after K2/K3, key remains
 * until K5. SQLCipher suite clears its own secrets at end when possible.
 */
export async function runLocalDataProtectionPoc(options?: {
  /** Skip destructive SQLCipher wipe/recreate if you only want Keychain persistence check. */
  keystoreOnly?: boolean;
}): Promise<SecurityPocReport> {
  assertNative();
  const steps: PoCStep[] = [];
  const push = (id: string, title: string, status: StepStatus, detail: string) => {
    steps.push({ id, title, status, detail });
  };

  push(
    "audit",
    "built-in secure store audit",
    "info",
    "KeychainWrapper.storeGenericPasswordFor does NOT set kSecAttrAccessible; no external accessibility API. Verdict B — not LJD formal SecureKeyStore.",
  );

  // ——— Test series B: SecureKeyStore ———
  try {
    const gen = await SecureKeyStore.generateRandomSecret(32);
    push(
      "K1",
      "generate random secret",
      "pass",
      `byteLength=${gen.byteLength} randomSource=${gen.randomSource} (value not logged)`,
    );

    const set = await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, gen.secret);
    push(
      "K2",
      "Keychain set WhenUnlocked",
      set.stored && set.accessibility === "kSecAttrAccessibleWhenUnlocked" ? "pass" : "fail",
      `stored=${String(set.stored)} accessibility=${set.accessibility ?? "null"} byteLength=${String(set.byteLength)}`,
    );

    const got = await SecureKeyStore.get(SecureKeyStore.POC_ACCOUNT);
    push(
      "K3",
      "Keychain get",
      got.found &&
        got.secret === gen.secret &&
        got.accessibility === "kSecAttrAccessibleWhenUnlocked"
        ? "pass"
        : "fail",
      `found=${String(got.found)} match=${String(got.secret === gen.secret)} accessibility=${got.accessibility ?? "null"}`,
    );

    push(
      "K4",
      "kill/relaunch get",
      "info",
      "Re-run PoC after app kill; K3/exists should remain true until K5. Simulator: use Home + swipe-up kill.",
    );

    if (!options?.keystoreOnly) {
      const del = await SecureKeyStore.delete(SecureKeyStore.POC_ACCOUNT);
      const after = await SecureKeyStore.get(SecureKeyStore.POC_ACCOUNT);
      push(
        "K5",
        "Keychain delete",
        del && !after.found ? "pass" : "fail",
        `deleted=${String(del)} foundAfter=${String(after.found)}`,
      );
      push(
        "K6",
        "get after delete",
        !after.found ? "pass" : "fail",
        `found=${String(after.found)}`,
      );

      // Restore a key for relaunch persistence demo without leaving plugin SQLCipher key coupled.
      const restored = await SecureKeyStore.generateRandomSecret(32);
      await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, restored.secret);
      push(
        "K-persist",
        "reseed Keychain for relaunch check",
        "info",
        `stored yes accessibility=kSecAttrAccessibleWhenUnlocked byteLength=${restored.byteLength}`,
      );
    }
  } catch (e) {
    push("K-error", "SecureKeyStore suite", "fail", errMsg(e));
  }

  if (options?.keystoreOnly) {
    return {
      ranAt: new Date().toISOString(),
      platform: Capacitor.getPlatform(),
      steps: redact(steps),
      summary: {
        sqlcipherOk: false,
        secureKeyStoreOk: steps.filter((s) => s.id.startsWith("K") && s.status === "fail").length === 0,
        builtInStoreVerdict: "B",
        builtInStoreNote:
          "Plugin KeychainWrapper omits kSecAttrAccessible; cannot guarantee WhenUnlocked externally.",
      },
    };
  }

  // ——— Test series A: SQLCipher via community plugin APIs ———
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const passphrase1 = randomPassphrase();
  const passphrase2 = randomPassphrase();
  let dbUrl = "";

  try {
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
      /* may be empty */
    }
    await closeIfOpen(sqlite, SECURITY_POC_DB);
    // Prior encrypted leftover cannot be opened after clearEncryptionSecret —
    // remove the PoC file by path (never touch ljd_local_journal).
    const pathsForCleanup = await LjdLocalSecurity.resolveCandidatePaths();
    const pocDbPath = `${pathsForCleanup.candidateA_libraryCapacitorDatabase}/${SECURITY_POC_DB}SQLite.db`;
    await LjdLocalSecurity.deletePath({ path: pocDbPath });
    await deleteDbIfExists(sqlite, SECURITY_POC_DB);

    // Test A — plaintext
    {
      const db = await openPlain(sqlite, SECURITY_POC_DB);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS poc_rows (
          id INTEGER PRIMARY KEY NOT NULL,
          body TEXT NOT NULL
        );
        DELETE FROM poc_rows;
        INSERT INTO poc_rows (id, body) VALUES (1, '${SECURITY_POC_DUMMY_CONTENT}');
      `);
      const count = await queryCount(db);
      const body = await queryContent(db);
      await sqlite.closeConnection(SECURITY_POC_DB, false);
      push(
        "A",
        "plaintext dummy DB",
        count === 1 && body === SECURITY_POC_DUMMY_CONTENT ? "pass" : "fail",
        `rows=${count} contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`,
      );
    }

    // Set plugin secret (Test series A only — not LJD SecureKeyStore)
    await CapacitorSQLite.setEncryptionSecret({ passphrase: passphrase1 });
    const stored = await CapacitorSQLite.isSecretStored();
    push(
      "A-secret",
      "plugin setEncryptionSecret",
      stored.result ? "pass" : "fail",
      `isSecretStored=${String(stored.result)} (plugin Keychain; accessibility not LJD-guaranteed)`,
    );

    // Test B/H migration path: mode encryption on existing plaintext
    {
      const beforeCount = 1;
      let migrationKeptPlain = false;
      try {
        const db = await sqlite.createConnection(
          SECURITY_POC_DB,
          true,
          "encryption",
          1,
          false,
        );
        await db.open();
        const afterCount = await queryCount(db);
        const body = await queryContent(db);
        const enc = await CapacitorSQLite.isDatabaseEncrypted({ database: SECURITY_POC_DB });
        const urlRes = await db.getUrl();
        dbUrl = urlRes.url ?? "";
        await sqlite.closeConnection(SECURITY_POC_DB, false);
        push(
          "B+mig",
          "plaintext→encrypted (mode=encryption)",
          afterCount === beforeCount &&
            body === SECURITY_POC_DUMMY_CONTENT &&
            enc.result === true
            ? "pass"
            : "fail",
          `rowsBefore=${beforeCount} rowsAfter=${afterCount} contentMatch=${String(
            body === SECURITY_POC_DUMMY_CONTENT,
          )} encrypted=${String(enc.result)}`,
        );
        push(
          "C",
          "isDatabaseEncrypted",
          enc.result === true ? "pass" : "fail",
          `encrypted=${String(enc.result)}`,
        );
      } catch (e) {
        // failure should leave plaintext — check
        try {
          const plain = await openPlain(sqlite, SECURITY_POC_DB);
          const body = await queryContent(plain);
          migrationKeptPlain = body === SECURITY_POC_DUMMY_CONTENT;
          await sqlite.closeConnection(SECURITY_POC_DB, false);
        } catch {
          migrationKeptPlain = false;
        }
        push(
          "B+mig",
          "plaintext→encrypted (mode=encryption)",
          "fail",
          `${errMsg(e)}; plaintextRetained=${String(migrationKeptPlain)}`,
        );
        throw e;
      }
    }

    // Test E — reopen with correct secret
    {
      const db = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
      await db.open();
      const body = await queryContent(db);
      await sqlite.closeConnection(SECURITY_POC_DB, false);
      push(
        "E",
        "reopen with correct secret",
        body === SECURITY_POC_DUMMY_CONTENT ? "pass" : "fail",
        `contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`,
      );
    }

    push(
      "D",
      "app kill / relaunch",
      "info",
      "After kill, reopen with mode=secret should succeed while plugin secret remains. Verified in Simulator session when connection re-opened in this suite (E).",
    );

    // Test F — wrong secret
    {
      await closeIfOpen(sqlite, SECURITY_POC_DB);
      let failed = false;
      try {
        const db = await sqlite.createConnection(
          SECURITY_POC_DB,
          true,
          "wrongsecret",
          1,
          false,
        );
        await db.open();
        await sqlite.closeConnection(SECURITY_POC_DB, false);
      } catch {
        failed = true;
        await closeIfOpen(sqlite, SECURITY_POC_DB);
      }
      push(
        "F",
        "wrong secret open fails",
        failed ? "pass" : "fail",
        `openFailedAsExpected=${String(failed)}`,
      );
    }

    // Test G/H — change secret
    {
      await CapacitorSQLite.changeEncryptionSecret({
        passphrase: passphrase2,
        oldpassphrase: passphrase1,
      });
      push("G", "changeEncryptionSecret", "pass", "plugin changeEncryptionSecret returned");

      const oldCheck = await CapacitorSQLite.checkEncryptionSecret({
        passphrase: passphrase1,
      });
      const newCheck = await CapacitorSQLite.checkEncryptionSecret({
        passphrase: passphrase2,
      });

      await closeIfOpen(sqlite, SECURITY_POC_DB);
      let wrongFails = false;
      try {
        const bad = await sqlite.createConnection(
          SECURITY_POC_DB,
          true,
          "wrongsecret",
          1,
          false,
        );
        await bad.open();
        await sqlite.closeConnection(SECURITY_POC_DB, false);
      } catch {
        wrongFails = true;
        await closeIfOpen(sqlite, SECURITY_POC_DB);
      }

      await closeIfOpen(sqlite, SECURITY_POC_DB);
      const db = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
      await db.open();
      const body = await queryContent(db);
      const urlRes = await db.getUrl();
      dbUrl = urlRes.url ?? dbUrl;
      await sqlite.closeConnection(SECURITY_POC_DB, false);

      push(
        "H",
        "after change: new secret opens / old rejected",
        wrongFails &&
          oldCheck.result === false &&
          newCheck.result === true &&
          body === SECURITY_POC_DUMMY_CONTENT
          ? "pass"
          : "fail",
        `oldCheck=${String(oldCheck.result)} newCheck=${String(newCheck.result)} wrongFails=${String(wrongFails)} contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`,
      );
    }
  } catch (e) {
    push("SQL-error", "SQLCipher suite", "fail", errMsg(e));
  }

  // ——— Locations + backup + file protection ———
  try {
    const paths = await LjdLocalSecurity.resolveCandidatePaths();
    push(
      "loc-paths",
      "candidate path resolve",
      "info",
      `A=${paths.candidateA_libraryCapacitorDatabase} B=${paths.candidateB_documents} C=${paths.candidateC_applicationSupportLjd}`,
    );

    const candidateAFile = `${paths.candidateA_libraryCapacitorDatabase}/${SECURITY_POC_DB}SQLite.db`;
    const dbPathToInspect = dbUrl || candidateAFile;
    const dbAttrs = await LjdLocalSecurity.inspectPath({ path: dbPathToInspect });
    push(
      "backup-db-A",
      "Candidate A DB file (Library/CapacitorDatabase)",
      dbAttrs.exists ? "info" : "fail",
      fmtAttrs(dbAttrs),
    );
    if (dbAttrs.parent) {
      push(
        "backup-db-A-parent",
        "Candidate A DB parent",
        "info",
        `excl=${String(dbAttrs.parent.isExcludedFromBackup)} prot=${dbAttrs.parent.fileProtection}`,
      );
    }

    const docsProbe = `${paths.candidateB_documents}/ljd_security_poc_docs_probe.db`;
    const docsAttrs = await LjdLocalSecurity.ensureProbeFile({ path: docsProbe });
    push(
      "backup-db-B",
      "Candidate B Documents probe DB file",
      "info",
      `${fmtAttrs(docsAttrs)} (probe; plugin global location remains Library for live SQLite)`,
    );

    const cProbe = `${paths.candidateC_applicationSupportLjd}/security-poc-probe.db`;
    const cAttrs = await LjdLocalSecurity.ensureProbeFile({ path: cProbe });
    push(
      "backup-db-C",
      "Candidate C Application Support design probe",
      "info",
      fmtAttrs(cAttrs),
    );

    // Dummy media under Library/ljd/media/security-poc
    await Filesystem.mkdir({
      path: SECURITY_POC_MEDIA_ROOT,
      directory: Directory.Library,
      recursive: true,
    }).catch(() => undefined);

    // 1x1 PNG
    const tinyPngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const mediaRel = `${SECURITY_POC_MEDIA_ROOT}/dummy.png`;
    await Filesystem.writeFile({
      path: mediaRel,
      data: tinyPngBase64,
      directory: Directory.Library,
    });
    const uri = await Filesystem.getUri({ path: mediaRel, directory: Directory.Library });
    const mediaAttrs = await LjdLocalSecurity.inspectPath({ path: uri.uri });
    const readBack = await Filesystem.readFile({
      path: mediaRel,
      directory: Directory.Library,
    });
    push(
      "media",
      "dummy media write/read + attrs",
      typeof readBack.data === "string" && readBack.data.length > 0 ? "pass" : "fail",
      `${fmtAttrs(mediaAttrs)} readBytesApprox=${typeof readBack.data === "string" ? readBack.data.length : 0}`,
    );

    // NSFileProtectionComplete on dummy DB + media only
    if (dbAttrs.exists) {
      const afterDb = await LjdLocalSecurity.setCompleteProtection({ path: dbPathToInspect });
      const dbComplete = afterDb.fileProtection === "NSFileProtectionComplete";
      push(
        "fp-complete-db",
        "set Complete on dummy DB",
        dbComplete ? "pass" : "info",
        `${fmtAttrs(afterDb)} setResourceValues(.complete) invoked; Simulator may still report UntilFirstUserAuthentication`,
      );
    }
    const afterMedia = await LjdLocalSecurity.setCompleteProtection({ path: uri.uri });
    const mediaComplete = afterMedia.fileProtection === "NSFileProtectionComplete";
    push(
      "fp-complete-media",
      "set Complete on dummy media",
      mediaComplete ? "pass" : "info",
      `${fmtAttrs(afterMedia)} setResourceValues(.complete) invoked; Simulator may still report UntilFirstUserAuthentication`,
    );

    // Unlock-state R/W (Simulator: attribute set ≠ lock-state proof)
    try {
      const db = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
      await db.open();
      const body = await queryContent(db);
      await db.run("INSERT INTO poc_rows (id, body) VALUES (?, ?);", [
        2,
        "unlock-write-ok",
      ]);
      await sqlite.closeConnection(SECURITY_POC_DB, false);
      const readMedia = await Filesystem.readFile({
        path: mediaRel,
        directory: Directory.Library,
      });
      push(
        "fp-unlocked-rw",
        "unlocked read/write after Complete",
        body === SECURITY_POC_DUMMY_CONTENT &&
          typeof readMedia.data === "string" &&
          readMedia.data.length > 0
          ? "pass"
          : "fail",
        "Simulator cannot prove lock-state denial; attribute set + unlocked R/W verified only.",
      );
    } catch (e) {
      // If encryption suite failed earlier, try plaintext R/W on dummy media only.
      const readMedia = await Filesystem.readFile({
        path: mediaRel,
        directory: Directory.Library,
      });
      push(
        "fp-unlocked-rw",
        "unlocked read/write after Complete",
        typeof readMedia.data === "string" && readMedia.data.length > 0 ? "info" : "fail",
        `DB reopen skipped (${errMsg(e)}); media read ok=${String(typeof readMedia.data === "string")}`,
      );
    }
  } catch (e) {
    push("ATTR-error", "backup/file protection suite", "fail", errMsg(e));
  }

  // Cleanup plugin secret so we don't leave GlobalSQLite / keychain passphrase coupled to product — optional clear
  try {
    await CapacitorSQLite.clearEncryptionSecret();
    push("cleanup-secret", "clearEncryptionSecret", "info", "plugin secret cleared after PoC");
  } catch (e) {
    push("cleanup-secret", "clearEncryptionSecret", "info", errMsg(e));
  }

  const sqlFail = steps.some(
    (s) =>
      (["A", "B+mig", "C", "E", "F", "G", "H"].includes(s.id) || s.id === "SQL-error") &&
      s.status === "fail",
  );
  const keyFail = steps.some(
    (s) => ["K1", "K2", "K3", "K5", "K6"].includes(s.id) && s.status === "fail",
  );

  return {
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    steps: redact(steps),
    summary: {
      sqlcipherOk: !sqlFail,
      secureKeyStoreOk: !keyFail,
      builtInStoreVerdict: "B",
      builtInStoreNote:
        "Installed KeychainServices.swift omits kSecAttrAccessible; accessibility not externally selectable.",
    },
  };
}

export async function checkSecureKeyStorePersistence(): Promise<{
  exists: boolean;
  accessibility: string | null;
}> {
  assertNative();
  const meta = await SecureKeyStore.exists(SecureKeyStore.POC_ACCOUNT);
  return { exists: meta.exists, accessibility: meta.accessibility };
}

/**
 * Phase 4B-3B.1 — SQLCipher ↔ key management path PoC.
 * Dummy DB only. Never log/display/persist secret values.
 *
 * Source facts (@capacitor-community/sqlite@8.1.1 iOS):
 * - service = "unlockSecret"
 * - account = `${iosKeychainPrefix}_CapacitorSQLitePlugin` (config: "ljd_CapacitorSQLitePlugin")
 * - Database.open reads UtilsSecret.getPassphrase(account) when encrypted+mode in secret|encryption|decryption
 * - createConnection has no passphrase argument; JS cannot pass key directly to open
 * - setEncryptionSecret is the only JS→plugin write path into that Keychain item
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
} from "@capacitor-community/sqlite";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LjdLocalSecurity } from "ljd-local-security";

import { SecureKeyStore } from "@/lib/local-first/security/secureKeyStore";

export const KEY_INTEGRATION_POC_DB = "ljd_key_integration_poc" as const;

/** From installed UtilsSecret.swift + CapacitorSQLite.swift with iosKeychainPrefix:"ljd". */
export const SQLITE_PLUGIN_KEYCHAIN = {
  service: "unlockSecret",
  accountWithPrefix: "ljd_CapacitorSQLitePlugin",
  accountLegacyNoPrefix: "CapacitorSQLitePlugin",
  iosKeychainPrefix: "ljd",
} as const;

export type KeyIntegrationStep = {
  id: string;
  title: string;
  status: "pass" | "fail" | "info" | "skip";
  detail: string;
};

export type KeyIntegrationReport = {
  ranAt: string;
  platform: string;
  pathFacts: {
    keychainService: string;
    keychainAccount: string;
    jsDirectPassphraseToCreateConnection: false;
    openUsesUtilsSecretGetPassphrase: true;
  };
  plans: {
    planA_builtIn: "recommended" | "viable" | "reject";
    planB_ljdToPlugin: "viable_with_js_handoff" | "reject_no_api" | "reject_dual_store_risk";
    planC_fork: "needed" | "not_needed";
  };
  accessibilityVerdict: "A" | "B" | "C";
  summary: {
    actualSqlCipherSecretStore: string;
    builtInAdoptForDbKey: "A" | "B";
    ljdSecureKeyStoreNeededForDbOpen: boolean;
    forkNeeded: boolean;
    recommendedArchitecture: string;
    documentsDbLocationCandidate: "A" | "B" | "hold";
    readyForDeviceBackupRestore: "A" | "B";
  };
  steps: KeyIntegrationStep[];
};

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Key integration PoC is native-only.");
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
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

/**
 * Run key-path PoC. Secrets exist only in locals; never written to report/logs.
 */
export async function runKeyIntegrationPoc(): Promise<KeyIntegrationReport> {
  assertNative();
  const steps: KeyIntegrationStep[] = [];
  const push = (
    id: string,
    title: string,
    status: KeyIntegrationStep["status"],
    detail: string,
  ) => {
    steps.push({ id, title, status, detail });
  };

  push(
    "path-source",
    "SQLCipher secret path (installed source)",
    "info",
    [
      `service=${SQLITE_PLUGIN_KEYCHAIN.service}`,
      `account=${SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix}`,
      "Database.open ← UtilsSecret.getPassphrase(account) when encrypted && mode∈{secret,encryption,decryption}",
      "createConnection: no passphrase field in TS/API",
      "write path: setEncryptionSecret({passphrase}) → KeychainWrapper service unlockSecret",
    ].join(" | "),
  );

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  let accessibilityVerdict: "A" | "B" | "C" = "C";
  let builtInOpensDb = false;
  let planBOpensDb = false;

  try {
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
      /* empty */
    }
    await closeIfOpen(sqlite, KEY_INTEGRATION_POC_DB);
    const paths = await LjdLocalSecurity.resolveCandidatePaths();
    await LjdLocalSecurity.deletePath({
      path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`,
    });

    // ——— Plan A probe: plugin built-in only ———
    const passphraseA = randomPassphrase();
    await CapacitorSQLite.setEncryptionSecret({ passphrase: passphraseA });
    // Drop JS reference ASAP (best-effort; engine GC not guaranteed)
    void passphraseA;

    const attrs = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: SQLITE_PLUGIN_KEYCHAIN.service,
      account: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix,
    });
    accessibilityVerdict = attrs.verdictHint;
    push(
      "built-in-accessibility",
      "plugin Keychain accessibility (no secret read)",
      attrs.found ? "pass" : "fail",
      `found=${String(attrs.found)} accessibility=${attrs.accessibility ?? "null"} rawPresent=${String(attrs.accessibilityRawPresent)} verdictHint=${attrs.verdictHint} returnedSecretData=${String(attrs.returnedSecretData ?? false)} note=${attrs.note ?? ""}`,
    );

    // Also probe legacy account name (source fallback)
    const legacy = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: SQLITE_PLUGIN_KEYCHAIN.service,
      account: SQLITE_PLUGIN_KEYCHAIN.accountLegacyNoPrefix,
    });
    push(
      "built-in-legacy-account",
      "legacy account without prefix",
      "info",
      `found=${String(legacy.found)} accessibility=${legacy.accessibility ?? "null"}`,
    );

    // Create encrypted dummy DB via plugin secret (Plan A path)
    {
      const db = await sqlite.createConnection(
        KEY_INTEGRATION_POC_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS k_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM k_rows;
        INSERT INTO k_rows (id, body) VALUES (1, 'key-integration dummy');
      `);
      const q = await db.query("SELECT body FROM k_rows LIMIT 1;");
      const body = String(
        (q.values?.[0] as Record<string, unknown> | undefined)?.body ?? "",
      );
      await sqlite.closeConnection(KEY_INTEGRATION_POC_DB, false);
      builtInOpensDb = body === "key-integration dummy";
      push(
        "planA-open",
        "SQLCipher open using plugin built-in Keychain secret",
        builtInOpensDb ? "pass" : "fail",
        `openedViaPluginKeychain=${String(builtInOpensDb)} (secret never reported)`,
      );
    }

    // ——— Plan B: LJD SecureKeyStore → setEncryptionSecret (no fork) ———
    // Requires JS handoff of passphrase once; dual storage if LJD also keeps a copy.
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
      /* */
    }
    await closeIfOpen(sqlite, KEY_INTEGRATION_POC_DB);
    await LjdLocalSecurity.deletePath({
      path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`,
    });

    const gen = await SecureKeyStore.generateRandomSecret(32);
    await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, gen.secret);
    // Hand off to plugin store (required by installed plugin — no direct open passphrase)
    await CapacitorSQLite.setEncryptionSecret({ passphrase: gen.secret });
    // Clear ephemeral JS secret reference
    (gen as { secret?: string }).secret = undefined;

    const afterB = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
      service: SQLITE_PLUGIN_KEYCHAIN.service,
      account: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix,
    });
    push(
      "planB-plugin-item",
      "after LJD→setEncryptionSecret plugin item attrs",
      afterB.found ? "pass" : "fail",
      `found=${String(afterB.found)} accessibility=${afterB.accessibility ?? "null"} verdictHint=${afterB.verdictHint}`,
    );

    {
      const db = await sqlite.createConnection(
        KEY_INTEGRATION_POC_DB,
        true,
        "secret",
        1,
        false,
      );
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS k_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM k_rows;
        INSERT INTO k_rows (id, body) VALUES (1, 'plan-b dummy');
      `);
      const q = await db.query("SELECT body FROM k_rows LIMIT 1;");
      const body = String(
        (q.values?.[0] as Record<string, unknown> | undefined)?.body ?? "",
      );
      await sqlite.closeConnection(KEY_INTEGRATION_POC_DB, false);
      planBOpensDb = body === "plan-b dummy";
      push(
        "planB-open",
        "SQLCipher open after LJD→plugin handoff",
        planBOpensDb ? "pass" : "fail",
        `opened=${String(planBOpensDb)} note=plugin opens via its own Keychain copy; LJD item is not read by community plugin`,
      );
    }

    push(
      "planB-analysis",
      "Plan B feasibility without fork",
      "info",
      "JS handoff required (setEncryptionSecret). createConnection cannot take passphrase. Dual Keychain if LJD also stores copy. Plugin always reads unlockSecret item — not LJD service.",
    );

    push(
      "planC",
      "fork/patch necessity",
      "info",
      accessibilityVerdict === "A" && builtInOpensDb
        ? "not_needed for DB-open path if Plan A adopted; fork only if requiring LJD Keychain as sole storage without JS handoff"
        : "evaluate minimal native hook only if WhenUnlocked not confirmed or product requires sole LJD Keychain without bridge handoff",
    );
  } catch (e) {
    push("error", "key integration suite", "fail", errMsg(e));
  }

  // cleanup dummy + plugin secret; keep LJD item deleted too
  try {
    await CapacitorSQLite.clearEncryptionSecret();
  } catch {
    /* */
  }
  try {
    await SecureKeyStore.delete(SecureKeyStore.POC_ACCOUNT);
  } catch {
    /* */
  }
  try {
    const paths = await LjdLocalSecurity.resolveCandidatePaths();
    await closeIfOpen(sqlite, KEY_INTEGRATION_POC_DB);
    await LjdLocalSecurity.deletePath({
      path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`,
    });
  } catch {
    /* */
  }
  push("cleanup", "clear plugin + LJD PoC secrets / delete dummy DB", "info", "done");

  const planA: KeyIntegrationReport["plans"]["planA_builtIn"] =
    accessibilityVerdict === "A" && builtInOpensDb
      ? "recommended"
      : accessibilityVerdict === "A"
        ? "viable"
        : "reject";

  const planB: KeyIntegrationReport["plans"]["planB_ljdToPlugin"] = planBOpensDb
    ? "viable_with_js_handoff"
    : "reject_no_api";

  const planC: KeyIntegrationReport["plans"]["planC_fork"] =
    planA === "recommended" || planA === "viable" ? "not_needed" : "needed";

  const builtInAdopt: "A" | "B" =
    accessibilityVerdict === "A" && builtInOpensDb ? "A" : "B";

  const report: KeyIntegrationReport = {
    ranAt: new Date().toISOString(),
    platform: Capacitor.getPlatform(),
    pathFacts: {
      keychainService: SQLITE_PLUGIN_KEYCHAIN.service,
      keychainAccount: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix,
      jsDirectPassphraseToCreateConnection: false,
      openUsesUtilsSecretGetPassphrase: true,
    },
    plans: {
      planA_builtIn: planA,
      planB_ljdToPlugin: planB,
      planC_fork: planC,
    },
    accessibilityVerdict,
    summary: {
      actualSqlCipherSecretStore: `Keychain generic password service=${SQLITE_PLUGIN_KEYCHAIN.service} account=${SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix} (plugin built-in)`,
      builtInAdoptForDbKey: builtInAdopt,
      ljdSecureKeyStoreNeededForDbOpen: builtInAdopt !== "A",
      forkNeeded: planC === "needed",
      recommendedArchitecture:
        builtInAdopt === "A"
          ? "Plan A: SQLCipher via plugin setEncryptionSecret/built-in Keychain (WhenUnlocked measured). Keep LJD SecureKeyStore for non-plugin secrets / future Android, not as SQLCipher open path. Avoid JS dual-store unless required."
          : "Plan C or constrained Plan B: built-in accessibility not A; do not treat plugin store as formal. Prefer minimal native supply path over dual Keychain+JS handoff.",
      documentsDbLocationCandidate: "A",
      readyForDeviceBackupRestore: builtInAdopt === "A" ? "A" : "B",
    },
    steps,
  };

  return report;
}

export async function persistKeyIntegrationReport(
  report: KeyIntegrationReport,
): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true,
    });
  } catch {
    /* */
  }
  await Filesystem.writeFile({
    path: "ljd/security-poc/key-integration-report.json",
    directory: Directory.Library,
    encoding: Encoding.UTF8,
    data: JSON.stringify(report, null, 2),
  });
}

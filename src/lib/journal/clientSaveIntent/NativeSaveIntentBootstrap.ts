/**
 * Native-only bootstrap for the independent Save Operation Intent SQLCipher DB.
 *
 * It never runs from generic Web boot, never exposes a key, and never offers a
 * plaintext fallback. AI-3 consumes its readiness plus server capability.
 */

import { Capacitor } from "@capacitor/core";
import type { PathAttributes } from "ljd-local-security";

import {
  applyCompleteFileProtection,
  configurePluginEncryptionSecret,
  ensurePathExcludedFromBackup,
  inspectFileProtection,
  inspectPluginDbKeyAccessibility,
  isCompleteProtection,
  resolveLjdApplicationSupportDir,
} from "@/lib/local-first/security";
import {
  createNativeClientSaveOperationIntentStore,
  initializeNativeClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore";
import {
  CLIENT_SAVE_OPERATION_INTENT_DB_NAME,
  type ClientSaveIntentStoreBootstrapResult,
  type ClientSaveIntentStoreReadiness,
  type ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

export type NativeSaveIntentBootstrapDependencies = {
  isNativePlatform: () => boolean;
  inspectKeychain: () => Promise<{ found: boolean; matchesWhenUnlocked: boolean }>;
  configureSecret: (secret: string) => Promise<void>;
  initializeDatabase: () => Promise<void>;
  createStore: () => ClientSaveOperationIntentStore;
  resolveApplicationSupport: () => Promise<{ ljdApplicationSupportDir: string }>;
  excludeFromBackup: (path: string) => Promise<PathAttributes>;
  applyCompleteProtection: (path: string) => Promise<PathAttributes>;
  inspectProtection: (path: string) => Promise<PathAttributes>;
  isCompleteProtection: (label: string) => boolean;
  generateSecret: () => string;
};

function generateEphemeralBootstrapSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nativeDatabasePath(databasesDir: string): string {
  return `${databasesDir.replace(/\/$/, "")}/${CLIENT_SAVE_OPERATION_INTENT_DB_NAME}SQLite.db`;
}

const productionDependencies: NativeSaveIntentBootstrapDependencies = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  inspectKeychain: inspectPluginDbKeyAccessibility,
  configureSecret: configurePluginEncryptionSecret,
  initializeDatabase: initializeNativeClientSaveOperationIntentStore,
  createStore: createNativeClientSaveOperationIntentStore,
  resolveApplicationSupport: resolveLjdApplicationSupportDir,
  excludeFromBackup: ensurePathExcludedFromBackup,
  applyCompleteProtection: applyCompleteFileProtection,
  inspectProtection: inspectFileProtection,
  isCompleteProtection,
  generateSecret: generateEphemeralBootstrapSecret,
};

async function initializeWithDependencies(
  deps: NativeSaveIntentBootstrapDependencies,
): Promise<ClientSaveIntentStoreBootstrapResult> {
  if (!deps.isNativePlatform()) return { status: "unsupported_platform" };

  let keychain;
  try {
    keychain = await deps.inspectKeychain();
  } catch {
    return { status: "secure_store_unavailable" };
  }
  if (keychain.found && !keychain.matchesWhenUnlocked) {
    return { status: "secure_store_unavailable" };
  }
  if (!keychain.found) {
    try {
      await deps.configureSecret(deps.generateSecret());
      keychain = await deps.inspectKeychain();
    } catch {
      return { status: "secure_store_unavailable" };
    }
  }
  if (!keychain.found || !keychain.matchesWhenUnlocked) {
    return { status: "secure_store_unavailable" };
  }

  try {
    await deps.initializeDatabase();
  } catch (error) {
    return {
      status: /intent_schema_(?:partial_or_unversioned|version_unsupported|columns_invalid)/.test(
        error instanceof Error ? error.message : "",
      )
        ? "schema_error"
        : "database_unavailable",
    };
  }

  try {
    const databasePath = nativeDatabasePath(
      (await deps.resolveApplicationSupport()).ljdApplicationSupportDir,
    );
    const backup = await deps.excludeFromBackup(databasePath);
    const protectedPath = await deps.applyCompleteProtection(databasePath);
    const inspected = await deps.inspectProtection(databasePath);
    if (
      backup.isExcludedFromBackup !== true ||
      protectedPath.fileProtection !== "NSFileProtectionComplete" ||
      !deps.isCompleteProtection(inspected.fileProtection)
    ) {
      return { status: "database_unavailable" };
    }
  } catch {
    return { status: "database_unavailable" };
  }
  try {
    return { status: "ready", store: deps.createStore() };
  } catch {
    return { status: "database_unavailable" };
  }
}

let initialization: Promise<ClientSaveIntentStoreBootstrapResult> | null = null;
let readiness: ClientSaveIntentStoreReadiness = { status: "unsupported_platform" };

/**
 * Idempotent per-process bootstrap. A successful call never recreates the DB
 * or key; failures are cached for the session and cause AI-3 to use legacy.
 */
export async function initializeSaveIntentStore(): Promise<ClientSaveIntentStoreBootstrapResult> {
  if (!initialization) {
    initialization = initializeWithDependencies(productionDependencies).then((result) => {
      readiness = { status: result.status };
      return result;
    });
  }
  return initialization;
}

export function getSaveIntentStoreReadiness(): ClientSaveIntentStoreReadiness {
  return readiness;
}

/** Test seam: no secret or platform bridge is involved in its callers. */
export async function initializeSaveIntentStoreForTest(
  deps: NativeSaveIntentBootstrapDependencies,
): Promise<ClientSaveIntentStoreBootstrapResult> {
  return initializeWithDependencies(deps);
}

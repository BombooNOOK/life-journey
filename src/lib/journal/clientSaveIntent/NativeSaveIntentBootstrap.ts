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
  isPluginEncryptionSecretStored,
  isCompleteProtection,
  resolveLjdApplicationSupportDir,
  PluginSecretConfigurationError,
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
  isPluginSecretStored: () => Promise<boolean>;
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

export type NativeSaveIntentBootstrapDiagnosticStage =
  | "not_started"
  | "platform"
  | "plugin_secret_read_initial"
  | "plugin_secret_create_api_unavailable"
  | "plugin_secret_create_encryption_not_configured"
  | "plugin_secret_create_database_location_unavailable"
  | "plugin_secret_create_keychain_write_failed"
  | "plugin_secret_create_unknown"
  | "plugin_secret_read_after_create"
  | "keychain_accessibility"
  | "database_open"
  | "storage_attributes"
  | "ready";

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
  isPluginSecretStored: isPluginEncryptionSecretStored,
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

type BootstrapAttempt = {
  result: ClientSaveIntentStoreBootstrapResult;
  diagnosticStage: NativeSaveIntentBootstrapDiagnosticStage;
};

async function initializeWithDependencies(
  deps: NativeSaveIntentBootstrapDependencies,
): Promise<BootstrapAttempt> {
  if (!deps.isNativePlatform()) {
    return { result: { status: "unsupported_platform" }, diagnosticStage: "platform" };
  }

  let secretStored: boolean;
  try {
    secretStored = await deps.isPluginSecretStored();
  } catch {
    return {
      result: { status: "secure_store_unavailable" },
      diagnosticStage: "plugin_secret_read_initial",
    };
  }
  if (!secretStored) {
    try {
      await deps.configureSecret(deps.generateSecret());
      secretStored = await deps.isPluginSecretStored();
    } catch (error) {
      return {
        result: { status: "secure_store_unavailable" },
        diagnosticStage:
          error instanceof PluginSecretConfigurationError
            ? `plugin_secret_create_${error.reason}`
            : "plugin_secret_create_unknown",
      };
    }
  }
  if (!secretStored) {
    return {
      result: { status: "secure_store_unavailable" },
      diagnosticStage: "plugin_secret_read_after_create",
    };
  }
  try {
    const keychain = await deps.inspectKeychain();
    if (!keychain.found || !keychain.matchesWhenUnlocked) {
      return {
        result: { status: "secure_store_unavailable" },
        diagnosticStage: "keychain_accessibility",
      };
    }
  } catch {
    return {
      result: { status: "secure_store_unavailable" },
      diagnosticStage: "keychain_accessibility",
    };
  }

  try {
    await deps.initializeDatabase();
  } catch (error) {
    return {
      result: {
        status: /intent_schema_(?:partial_or_unversioned|version_unsupported|columns_invalid)/.test(
          error instanceof Error ? error.message : "",
        )
          ? "schema_error"
          : "database_unavailable",
      },
      diagnosticStage: "database_open",
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
      return { result: { status: "database_unavailable" }, diagnosticStage: "storage_attributes" };
    }
  } catch {
    return { result: { status: "database_unavailable" }, diagnosticStage: "storage_attributes" };
  }
  try {
    return { result: { status: "ready", store: deps.createStore() }, diagnosticStage: "ready" };
  } catch {
    return { result: { status: "database_unavailable" }, diagnosticStage: "database_open" };
  }
}

let initialization: Promise<ClientSaveIntentStoreBootstrapResult> | null = null;
let readiness: ClientSaveIntentStoreReadiness = { status: "unsupported_platform" };
let diagnosticStage: NativeSaveIntentBootstrapDiagnosticStage = "not_started";

/**
 * Idempotent per-process bootstrap. A successful call never recreates the DB
 * or key; failures are cached for the session and cause AI-3 to use legacy.
 */
export async function initializeSaveIntentStore(): Promise<ClientSaveIntentStoreBootstrapResult> {
  if (!initialization) {
    initialization = initializeWithDependencies(productionDependencies).then((attempt) => {
      diagnosticStage = attempt.diagnosticStage;
      readiness = { status: attempt.result.status };
      return attempt.result;
    });
  }
  return initialization;
}

export function getSaveIntentStoreReadiness(): ClientSaveIntentStoreReadiness {
  return readiness;
}

/** Developer diagnostics only; contains a stage code and never secret/error text. */
export function getSaveIntentStoreBootstrapDiagnosticStage(): NativeSaveIntentBootstrapDiagnosticStage {
  return diagnosticStage;
}

/** Test seam: no secret or platform bridge is involved in its callers. */
export async function initializeSaveIntentStoreForTest(
  deps: NativeSaveIntentBootstrapDependencies,
): Promise<ClientSaveIntentStoreBootstrapResult> {
  return (await initializeWithDependencies(deps)).result;
}

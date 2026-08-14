import { describe, expect, it, vi } from "vitest";
import type { PathAttributes } from "ljd-local-security";

import {
  getSaveIntentStoreReadiness,
  initializeSaveIntentStoreForTest,
  type NativeSaveIntentBootstrapDependencies,
} from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";

const pathAttributes: PathAttributes = {
  path: "/Application Support/app.bamboonook.ljd/ljd_client_save_operation_intentSQLite.db",
  exists: true,
  isExcludedFromBackup: true,
  fileProtection: "NSFileProtectionComplete",
};

function dependencies(
  overrides: Partial<NativeSaveIntentBootstrapDependencies> = {},
): NativeSaveIntentBootstrapDependencies {
  return {
    isNativePlatform: () => true,
    inspectKeychain: async () => ({ found: true, matchesWhenUnlocked: true }),
    configureSecret: async () => undefined,
    initializeDatabase: async () => undefined,
    createStore: createMemoryClientSaveOperationIntentStore,
    resolveApplicationSupport: async () => ({
      ljdApplicationSupportDir: "/Application Support/app.bamboonook.ljd",
    }),
    excludeFromBackup: async () => pathAttributes,
    applyCompleteProtection: async () => pathAttributes,
    inspectProtection: async () => pathAttributes,
    isCompleteProtection: (label) => label === "NSFileProtectionComplete",
    generateSecret: () => "",
    ...overrides,
  };
}

describe("4B-4AI-2 native secure save-intent bootstrap", () => {
  it("returns unsupported on browser and never configures a secret", async () => {
    const configureSecret = vi.fn();
    await expect(
      initializeSaveIntentStoreForTest(
        dependencies({ isNativePlatform: () => false, configureSecret }),
      ),
    ).resolves.toEqual({ status: "unsupported_platform" });
    expect(configureSecret).not.toHaveBeenCalled();
  });

  it("creates a plugin secret only when none exists, then prepares one encrypted store", async () => {
    let keychainCalls = 0;
    const configureSecret = vi.fn(async () => undefined);
    const initializeDatabase = vi.fn(async () => undefined);
    const result = await initializeSaveIntentStoreForTest(
      dependencies({
        inspectKeychain: async () => {
          keychainCalls += 1;
          return keychainCalls === 1
            ? { found: false, matchesWhenUnlocked: false }
            : { found: true, matchesWhenUnlocked: true };
        },
        configureSecret,
        initializeDatabase,
      }),
    );
    expect(result.status).toBe("ready");
    expect(configureSecret).toHaveBeenCalledTimes(1);
    expect(initializeDatabase).toHaveBeenCalledTimes(1);
  });

  it("fails closed for inaccessible Keychain, schema mismatch, or storage attributes", async () => {
    await expect(
      initializeSaveIntentStoreForTest(
        dependencies({
          inspectKeychain: async () => ({ found: true, matchesWhenUnlocked: false }),
        }),
      ),
    ).resolves.toEqual({ status: "secure_store_unavailable" });

    await expect(
      initializeSaveIntentStoreForTest(
        dependencies({
          initializeDatabase: async () => {
            throw new Error("intent_schema_version_unsupported");
          },
        }),
      ),
    ).resolves.toEqual({ status: "schema_error" });

    await expect(
      initializeSaveIntentStoreForTest(
        dependencies({
          excludeFromBackup: async () => ({
            ...pathAttributes,
            isExcludedFromBackup: false,
          }),
        }),
      ),
    ).resolves.toEqual({ status: "database_unavailable" });
  });

  it("exposes only a status before native initialization", () => {
    expect(getSaveIntentStoreReadiness()).toEqual({ status: "unsupported_platform" });
  });
});

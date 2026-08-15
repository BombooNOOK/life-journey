import { describe, expect, it, vi } from "vitest";

import { ensureNativeClientSaveOperationIntentSchemaForTest } from "@/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore";

describe("native Save Intent schema v2", () => {
  it("migrates v1 additively without touching existing intent rows", async () => {
    const execute = vi.fn(async () => undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql === "PRAGMA user_version") return { values: [{ user_version: 1 }] };
      if (sql === "PRAGMA table_info(client_save_operation_intent)") {
        return {
          values: [
            "intent_id", "save_operation_id", "actor_key", "draft_ref", "request_fingerprint",
            "status", "server_entry_id", "failure_code", "created_at", "updated_at",
            "last_attempt_at", "completed_at",
          ].map((name) => ({ name })),
        };
      }
      throw new Error(`unexpected_query:${sql}`);
    });
    await ensureNativeClientSaveOperationIntentSchemaForTest({ query, execute });
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("client_save_operation_deletion_tombstone"));
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 2");
    expect(execute.mock.calls.flat().join("\n")).not.toMatch(/\bDROP\b|\bDELETE\b/i);
  });

  it("rejects unknown schema versions without reset", async () => {
    const execute = vi.fn(async () => undefined);
    await expect(
      ensureNativeClientSaveOperationIntentSchemaForTest({
        query: async () => ({ values: [{ user_version: 99 }] }),
        execute,
      }),
    ).rejects.toThrow("intent_schema_version_unsupported");
    expect(execute).not.toHaveBeenCalled();
  });
});

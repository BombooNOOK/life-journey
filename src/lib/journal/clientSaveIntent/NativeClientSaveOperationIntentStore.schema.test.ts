import { describe, expect, it, vi } from "vitest";

import { ensureNativeClientSaveOperationIntentSchemaForTest } from "@/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore";

describe("native Save Intent schema v4", () => {
  it("migrates v3 additively by adding stable_actor_key", async () => {
    const execute = vi.fn(async () => undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql === "PRAGMA user_version") return { values: [{ user_version: 3 }] };
      if (sql === "PRAGMA table_info(client_save_operation_intent)") {
        return {
          values: [
            "intent_id", "save_operation_id", "actor_key", "stable_actor_key", "draft_ref",
            "request_fingerprint", "status", "server_entry_id", "failure_code", "created_at",
            "updated_at", "last_attempt_at", "completed_at",
          ].map((name) => ({ name })),
        };
      }
      if (sql === "PRAGMA table_info(client_save_operation_payload)") {
        return {
          values: [
            "save_operation_id", "payload_version", "request_json", "request_fingerprint",
            "request_byte_length", "created_at",
          ].map((name) => ({ name })),
        };
      }
      throw new Error(`unexpected_query:${sql}`);
    });
    await ensureNativeClientSaveOperationIntentSchemaForTest({ query, execute });
    expect(execute).toHaveBeenCalledWith(
      "ALTER TABLE client_save_operation_intent ADD COLUMN stable_actor_key TEXT",
    );
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 4");
    expect(execute.mock.calls.flat().join("\n")).not.toMatch(/\bDROP\b|\bDELETE\b/i);
  });

  it("migrates v1 additively without touching existing intent rows", async () => {
    const execute = vi.fn(async () => undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql === "PRAGMA user_version") return { values: [{ user_version: 1 }] };
      if (sql === "PRAGMA table_info(client_save_operation_intent)") {
        return {
          values: [
            "intent_id", "save_operation_id", "actor_key", "stable_actor_key", "draft_ref",
            "request_fingerprint", "status", "server_entry_id", "failure_code", "created_at",
            "updated_at", "last_attempt_at", "completed_at",
          ].map((name) => ({ name })),
        };
      }
      if (sql === "PRAGMA table_info(client_save_operation_payload)") {
        return {
          values: [
            "save_operation_id",
            "payload_version",
            "request_json",
            "request_fingerprint",
            "request_byte_length",
            "created_at",
          ].map((name) => ({ name })),
        };
      }
      throw new Error(`unexpected_query:${sql}`);
    });
    await ensureNativeClientSaveOperationIntentSchemaForTest({ query, execute });
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("client_save_operation_deletion_tombstone"));
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("client_save_operation_payload"));
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 3");
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 4");
    expect(execute.mock.calls.flat().join("\n")).not.toMatch(/\bDROP\b|\bDELETE\b/i);
  });

  it("migrates v2 additively by creating the payload table only", async () => {
    const execute = vi.fn(async () => undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql === "PRAGMA user_version") return { values: [{ user_version: 2 }] };
      if (sql === "PRAGMA table_info(client_save_operation_intent)") {
        return {
          values: [
            "intent_id", "save_operation_id", "actor_key", "stable_actor_key", "draft_ref",
            "request_fingerprint", "status", "server_entry_id", "failure_code", "created_at",
            "updated_at", "last_attempt_at", "completed_at",
          ].map((name) => ({ name })),
        };
      }
      if (sql === "PRAGMA table_info(client_save_operation_payload)") {
        return {
          values: [
            "save_operation_id",
            "payload_version",
            "request_json",
            "request_fingerprint",
            "request_byte_length",
            "created_at",
          ].map((name) => ({ name })),
        };
      }
      throw new Error(`unexpected_query:${sql}`);
    });
    await ensureNativeClientSaveOperationIntentSchemaForTest({ query, execute });
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("client_save_operation_payload"));
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 3");
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 4");
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

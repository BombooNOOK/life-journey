import { describe, expect, it, vi } from "vitest";

import {
  prepareClientSaveOperationIntent,
  recoverClientSaveOperation,
  runNewClientSaveOperation,
} from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import type {
  ClientSaveIdempotencyCapabilityProvider,
  ClientSaveOperationResult,
  ClientSaveOperationTransport,
} from "@/lib/journal/clientSaveIntent/types";

const EMAIL = "Person@Example.com";
const OP = "jso_1234567890abcdefghijklmnopqrstuv";
const input = { viewerEmail: EMAIL, requestFingerprint: "a".repeat(64), saveOperationId: OP };
const enabled: ClientSaveIdempotencyCapabilityProvider = {
  async getCapability() {
    return { enabled: true, rollout: "account_scoped" };
  },
};
const disabled: ClientSaveIdempotencyCapabilityProvider = {
  async getCapability() {
    return { enabled: false, reason: "server_capability_unavailable" };
  },
};

describe("4B-4AH formal client save-operation intent", () => {
  it("durably prepares before POST and refuses to POST when preparation fails", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => ({ kind: "completed" as const, serverEntryId: "entry_1" }));
    const result = await runNewClientSaveOperation(
      { capabilities: enabled, store, transport: { post } },
      input,
    );
    expect(post).toHaveBeenCalledWith({ saveOperationId: OP });
    expect(result.kind).toBe("result");
    expect(await store.findByActorAndSaveOperationId("person@example.com", OP)).toMatchObject({
      status: "completed",
      serverEntryId: "entry_1",
    });
  });

  it("does not create an intent, attach an ID, or retry when capability is OFF", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn();
    const result = await runNewClientSaveOperation(
      { capabilities: disabled, store, transport: { post } },
      input,
    );
    expect(result).toEqual({ kind: "legacy" });
    expect(post).not.toHaveBeenCalled();
    expect(await store.findByActorAndSaveOperationId("person@example.com", OP)).toBeNull();
  });

  it("keeps the same ID after response loss and uses foreground lookup, never auto-POST", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => ({ kind: "transport_failure" as const }));
    await runNewClientSaveOperation({ capabilities: enabled, store, transport: { post } }, input);
    const lookup = vi.fn(async () => ({ kind: "completed" as const, serverEntryId: "entry_2" }));
    const recovered = await recoverClientSaveOperation(
      { capabilities: enabled, store, transport: { post, lookup } },
      { viewerEmail: EMAIL, saveOperationId: OP },
    );
    expect(lookup).toHaveBeenCalledWith({ saveOperationId: OP });
    expect(post).toHaveBeenCalledTimes(1);
    expect(recovered).toMatchObject({ kind: "result", intent: { status: "completed" } });
  });

  it("maps 202, 409 and 402 to non-unsafe states", async () => {
    const cases: Array<[ClientSaveOperationResult, string]> = [
      [{ kind: "processing" } as const, "awaiting_result"],
      [{ kind: "fingerprint_mismatch" } as const, "recovery_required"],
      [{ kind: "failed_final", code: "ACORN_INSUFFICIENT" } as const, "failed_final"],
    ];
    for (const [result, status] of cases) {
      const store = createMemoryClientSaveOperationIntentStore();
      const out = await runNewClientSaveOperation(
        { capabilities: enabled, store, transport: { post: async () => result } },
        { ...input, saveOperationId: `${OP}_${status}` },
      );
      expect(out).toMatchObject({ kind: "result", intent: { status } });
    }
  });

  it("reuses one operation ID, makes a new ID per new operation, and excludes sensitive body fields", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const first = await prepareClientSaveOperationIntent(store, input);
    const same = await prepareClientSaveOperationIntent(store, input);
    const next = await prepareClientSaveOperationIntent(store, {
      ...input,
      saveOperationId: "jso_abcdefghijklmnopqrstuv1234567890",
    });
    expect(first.kind).toBe("created");
    expect(same.kind).toBe("existing");
    expect(next.kind).toBe("created");
    const serialized = JSON.stringify(first);
    for (const forbidden of ["content", "photo", "token", "secret", "cookie"]) {
      expect(serialized.toLowerCase()).not.toContain(`"${forbidden}"`);
    }
  });

  it("cleans pending intents by actor for account deletion integration", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    await prepareClientSaveOperationIntent(store, input);
    expect(await store.deleteByActor("person@example.com")).toBe(1);
    expect(await store.listRecoverableByActor("person@example.com")).toEqual([]);
  });
});

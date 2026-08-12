import { describe, expect, it } from "vitest";

import {
  canExplicitResume,
  createInitialState,
  shouldNoOp,
} from "@/lib/local-first/journal/encryptionMigration/stateStore";

describe("encryption migration state machine", () => {
  it("starts not_started and never stores secrets", () => {
    const state = createInitialState();
    expect(state.phase).toBe("not_started");
    expect(state.secretStoredInLog).toBe(false);
    expect(state.sourcePreserved).toBe(true);
  });

  it("treats promoted as completed no-op", () => {
    expect(shouldNoOp("promoted")).toBe(true);
    expect(shouldNoOp("verified")).toBe(false);
  });

  it("allows explicit resume only for incomplete phases (not boot autorun)", () => {
    expect(canExplicitResume("staging")).toBe(true);
    expect(canExplicitResume("failed")).toBe(true);
    expect(canExplicitResume("not_started")).toBe(false);
    expect(canExplicitResume("promoted")).toBe(false);
  });

  it("serializes state without secret-like keys", () => {
    const json = JSON.stringify(
      createInitialState({ phase: "failed", lastError: "verify_mismatch:contentHash" }),
    );
    expect(json).not.toMatch(/passphrase|encryptionSecret|sqlitekey/i);
    expect(json).toContain('"sourcePreserved":true');
  });
});

import { describe, expect, it } from "vitest";

import {
  assertClientSaveOperationIntentTransition,
  isClientSaveOperationIntentTransitionAllowed,
} from "@/lib/journal/clientSaveIntent/lifecycle";

describe("client save intent lifecycle", () => {
  it("allows forward transitions and same-state idempotency", () => {
    expect(isClientSaveOperationIntentTransitionAllowed("prepared", "awaiting_result")).toBe(
      true,
    );
    expect(isClientSaveOperationIntentTransitionAllowed("awaiting_result", "server_completed")).toBe(
      true,
    );
    expect(isClientSaveOperationIntentTransitionAllowed("server_completed", "completed")).toBe(
      true,
    );
    expect(isClientSaveOperationIntentTransitionAllowed("completed", "completed")).toBe(true);
  });

  it("lets a recovery-required intent accept a late server result", () => {
    expect(
      isClientSaveOperationIntentTransitionAllowed("recovery_required", "server_completed"),
    ).toBe(true);
    expect(isClientSaveOperationIntentTransitionAllowed("recovery_required", "prepared")).toBe(
      false,
    );
  });

  it("rejects terminal-state rewinds", () => {
    expect(() =>
      assertClientSaveOperationIntentTransition("completed", "awaiting_result"),
    ).toThrow("intent_transition_invalid");
    expect(() =>
      assertClientSaveOperationIntentTransition("completed", "prepared"),
    ).toThrow("intent_transition_invalid");
    expect(() =>
      assertClientSaveOperationIntentTransition("failed_final", "prepared"),
    ).toThrow("intent_transition_invalid");
    expect(() =>
      assertClientSaveOperationIntentTransition("failed_final", "awaiting_result"),
    ).toThrow("intent_transition_invalid");
  });
});

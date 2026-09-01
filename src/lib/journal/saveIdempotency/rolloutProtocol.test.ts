import { describe, expect, it } from "vitest";

import {
  resolveSaveCapability,
  toPublicSaveOperationLookup,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";

describe("4B-4AI-1 capability admission", () => {
  it.each([
    [false, null, false],
    [false, { enabled: true, protocolVersion: 1 }, false],
    [true, null, false],
    [true, { enabled: false, protocolVersion: 1 }, false],
    [true, { enabled: true, protocolVersion: 2 }, false],
    [true, { enabled: true, protocolVersion: 1 }, true],
  ] as const)("requires global AND an enabled supported row", (globalEnabled, rollout, expected) => {
    const capability = resolveSaveCapability({ globalEnabled, rollout });
    expect(capability.idempotentSaveEnabled).toBe(expected);
    expect(capability.lookupSupported).toBe(expected);
    expect(capability.foregroundRecoverySupported).toBe(expected);
    expect(capability.automaticBackgroundRetry).toBe(false);
    expect(capability.stableActorAdmission).toBe(false);
  });

  it("stableActorAdmission requires stable write actor mode", () => {
    expect(
      resolveSaveCapability({
        globalEnabled: true,
        rollout: { enabled: true, protocolVersion: 1 },
        writeActorMode: "stable",
      }).stableActorAdmission,
    ).toBe(true);
    expect(
      resolveSaveCapability({
        globalEnabled: true,
        rollout: { enabled: true, protocolVersion: 1 },
        writeActorMode: "legacy",
      }).stableActorAdmission,
    ).toBe(false);
  });
});

describe("4B-4AI-1 public same-operation lookup", () => {
  const fp = "f".repeat(64);

  it("does not expose checkpoint, actor, or stored fingerprint", () => {
    const result = toPublicSaveOperationLookup({
      suppliedFingerprint: fp,
      row: {
        status: "processing",
        journalEntryId: "entry-hidden",
        requestFingerprint: fp,
        resultCode: null,
      },
    });
    expect(result).toEqual({ protocolVersion: 1, state: "processing" });
    expect(JSON.stringify(result)).not.toMatch(/actor|fingerprint|checkpoint|entry-hidden/i);
  });

  it("maps own terminal states to minimal safe responses", () => {
    expect(
      toPublicSaveOperationLookup({
        suppliedFingerprint: fp,
        row: {
          status: "completed",
          journalEntryId: "entry_1",
          requestFingerprint: fp,
          resultCode: "OK",
        },
      }),
    ).toEqual({ protocolVersion: 1, state: "completed", entryId: "entry_1" });
    expect(
      toPublicSaveOperationLookup({
        suppliedFingerprint: fp,
        row: {
          status: "failed_final",
          journalEntryId: null,
          requestFingerprint: fp,
          resultCode: "ACORN_INSUFFICIENT",
        },
      }),
    ).toEqual({ protocolVersion: 1, state: "failed_final", errorCategory: "acorn" });
  });

  it("returns mismatch without operation details and not_found for absent/other scoped rows", () => {
    expect(
      toPublicSaveOperationLookup({
        suppliedFingerprint: "other",
        row: {
          status: "completed",
          journalEntryId: "entry_1",
          requestFingerprint: fp,
          resultCode: "OK",
        },
      }),
    ).toEqual({ protocolVersion: 1, state: "fingerprint_mismatch" });
    expect(toPublicSaveOperationLookup({ suppliedFingerprint: fp, row: null })).toEqual({
      protocolVersion: 1,
      state: "not_found",
    });
  });
});

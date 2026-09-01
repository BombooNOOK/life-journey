/**
 * AI-X6.4 recovery route wiring — legacy OFF vs stable ON.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewerEmailFromCookie = vi.fn();
const observeJournalIdentityShadow = vi.fn();
const resolveJournalSaveRecoveryAuthority = vi.fn();
const findJournalSaveOperationByAuthorizedActorKeys = vi.fn();

vi.mock("@/lib/auth/viewer", () => ({
  getViewerEmailFromCookie,
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));
vi.mock("@/lib/auth/observeJournalIdentityShadow", () => ({
  observeJournalIdentityShadow,
}));
vi.mock("@/lib/journal/saveIdempotency/resolveJournalSaveRecoveryAuthority", () => ({
  resolveJournalSaveRecoveryAuthority,
}));
vi.mock(
  "@/lib/journal/saveIdempotency/findJournalSaveOperationByAuthorizedActorKeys",
  () => ({
    findJournalSaveOperationByAuthorizedActorKeys,
  }),
);
vi.mock("@/lib/db", () => ({
  prisma: {},
}));

const lookup = await import("@/app/api/journal/save-operations/[saveOperationId]/route");

const FP = "a".repeat(64);
const OP = "01HXSAVEOPERATIONID00000001";

function req() {
  return new Request(
    `https://ljd.invalid/api/journal/save-operations/${OP}?requestFingerprint=${FP}`,
  );
}

describe("AI-X6.4 save-operation recovery route wiring", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    observeJournalIdentityShadow.mockResolvedValue(null);
  });

  it("A/M: legacy authority → single cookie key lookup; public not_found", async () => {
    getViewerEmailFromCookie.mockResolvedValue("owner@ljd.invalid");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "legacy",
      actorKeys: ["owner@ljd.invalid"],
    });
    findJournalSaveOperationByAuthorizedActorKeys.mockResolvedValue({
      kind: "not_found",
    });

    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(await res.json()).toEqual({ protocolVersion: 1, state: "not_found" });
    expect(findJournalSaveOperationByAuthorizedActorKeys).toHaveBeenCalledWith(
      expect.anything(),
      {
        actorKeys: ["owner@ljd.invalid"],
        saveOperationId: OP,
      },
    );
  });

  it("C: claim-backed found after email change", async () => {
    getViewerEmailFromCookie.mockResolvedValue("new@example.com");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "stable",
      actorKeys: ["firebase:UID-1", "old@example.com"],
      firebaseUid: "UID-1",
      identityId: "id-1",
    });
    findJournalSaveOperationByAuthorizedActorKeys.mockResolvedValue({
      kind: "found",
      row: {
        status: "completed",
        journalEntryId: "entry_legacy",
        requestFingerprint: FP,
        resultCode: "OK",
      },
    });

    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(await res.json()).toEqual({
      protocolVersion: 1,
      state: "completed",
      entryId: "entry_legacy",
    });
    expect(findJournalSaveOperationByAuthorizedActorKeys).toHaveBeenCalledWith(
      expect.anything(),
      {
        actorKeys: ["firebase:UID-1", "old@example.com"],
        saveOperationId: OP,
      },
    );
  });

  it("D/E: current email alone / reuse — not_found when authority excludes claim", async () => {
    getViewerEmailFromCookie.mockResolvedValue("old@example.com");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "stable",
      actorKeys: ["firebase:UID-2"],
      firebaseUid: "UID-2",
      identityId: "id-2",
    });
    findJournalSaveOperationByAuthorizedActorKeys.mockResolvedValue({
      kind: "not_found",
    });

    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(await res.json()).toEqual({ protocolVersion: 1, state: "not_found" });
    expect(findJournalSaveOperationByAuthorizedActorKeys.mock.calls[0]![1]).toEqual(
      {
        actorKeys: ["firebase:UID-2"],
        saveOperationId: OP,
      },
    );
  });

  it("G: ambiguous → JSO_RECOVERY_AMBIGUOUS without exposing keys", async () => {
    getViewerEmailFromCookie.mockResolvedValue("new@example.com");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "stable",
      actorKeys: ["firebase:UID-1", "old@example.com"],
      firebaseUid: "UID-1",
      identityId: "id-1",
    });
    findJournalSaveOperationByAuthorizedActorKeys.mockResolvedValue({
      kind: "ambiguous",
      matchCount: 2,
    });

    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({
      error: "保存状態を一意に特定できません。",
      code: "JSO_RECOVERY_AMBIGUOUS",
    });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("firebase:");
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("UID-");
  });

  it("I: identity_not_bound → fail closed, no lookup", async () => {
    getViewerEmailFromCookie.mockResolvedValue("a@example.com");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "stable_rejected",
      reason: "identity_not_bound",
    });

    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      code: "STABLE_IDENTITY_REQUIRED",
      state: "identity_not_bound",
    });
    expect(findJournalSaveOperationByAuthorizedActorKeys).not.toHaveBeenCalled();
  });

  it("J: verified_session_required → 401", async () => {
    getViewerEmailFromCookie.mockResolvedValue("a@example.com");
    resolveJournalSaveRecoveryAuthority.mockResolvedValue({
      mode: "stable_rejected",
      reason: "verified_session_required",
    });
    const res = await lookup.GET(req(), {
      params: Promise.resolve({ saveOperationId: OP }),
    });
    expect(res.status).toBe(401);
    expect(findJournalSaveOperationByAuthorizedActorKeys).not.toHaveBeenCalled();
  });
});

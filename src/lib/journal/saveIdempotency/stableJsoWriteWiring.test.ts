/**
 * AI-X6.3 wiring: stable JSO write authority under feature flag.
 * Historical recovery lookup remains email-scoped (X6.4).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewerEmailFromCookie = vi.fn();
const isJournalSaveIdempotencyEnabled = vi.fn();
const findRollout = vi.fn();
const findOperation = vi.fn();
const observeJournalIdentityShadow = vi.fn();
const resolveJournalSaveWriteActorKey = vi.fn();
const executeJournalSaveOperation = vi.fn();
const createPrismaJournalSaveOperationStore = vi.fn(() => ({ kind: "store" }));
const createProductionJournalSavePorts = vi.fn(() => ({ kind: "ports" }));

vi.mock("@/lib/auth/viewer", () => ({
  getViewerEmailFromCookie,
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));
vi.mock("@/lib/journal/saveIdempotency/journalSaveIdempotencyGate", () => ({
  isJournalSaveIdempotencyEnabled,
}));
vi.mock("@/lib/auth/observeJournalIdentityShadow", () => ({
  observeJournalIdentityShadow,
}));
vi.mock("@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey")
  >("@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey");
  return {
    ...actual,
    resolveJournalSaveWriteActorKey,
  };
});
vi.mock("@/lib/db", () => ({
  prisma: {
    journalSaveIdempotencyRollout: { findUnique: findRollout },
    journalSaveOperation: { findUnique: findOperation },
    journalEntry: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/journal/saveIdempotency/executeJournalSaveOperation", () => ({
  executeJournalSaveOperation,
}));
vi.mock("@/lib/journal/saveIdempotency/prismaJournalSaveOperationStore", () => ({
  createPrismaJournalSaveOperationStore,
}));
vi.mock("@/lib/journal/saveIdempotency/productionJournalSavePorts", () => ({
  createProductionJournalSavePorts,
  entrySelect: {},
}));
vi.mock("@/lib/loghouse/donguriLedger", () => ({
  sumDonguriBalance: vi.fn(async () => 0),
}));
vi.mock("@/lib/journal/kanteiCommentEligibility", () => ({
  profileHasKanteiOrder: vi.fn(async () => false),
}));
vi.mock("@/lib/profile/orderPerProfile", () => ({
  findKanteiOrderForProfile: vi.fn(async () => null),
}));
vi.mock("@/lib/journal/journalEntryApiSerialize", () => ({
  formatJournalEntryForApiResponse: (e: unknown) => e,
}));

const capability = await import("@/app/api/journal/save-capability/route");
const lookup = await import("@/app/api/journal/save-operations/[saveOperationId]/route");
const { runIdempotentProductionJournalSave } = await import(
  "@/lib/journal/saveIdempotency/runIdempotentProductionJournalSave"
);

const PORT = {
  viewerEmail: "person@example.com",
  profileId: "p1",
  content: "x",
  mood: "calm",
  companionType: "owl",
  activity: "record_anyway",
  designTheme: "simple_plain",
  includeInBook: true,
  photoPatch: { kind: "none" as const },
  parsedEntryDate: new Date("2026-01-01T00:00:00.000Z"),
};

describe("AI-X6.3 stable JSO write wiring", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createPrismaJournalSaveOperationStore.mockReturnValue({ kind: "store" });
    createProductionJournalSavePorts.mockReturnValue({ kind: "ports" });
    observeJournalIdentityShadow.mockResolvedValue(null);
  });

  it("J: same UID + same saveOperationId across email change keeps stable actor scope", async () => {
    resolveJournalSaveWriteActorKey.mockResolvedValue({
      mode: "stable",
      actorKey: "firebase:UID-1",
      firebaseUid: "UID-1",
      identityId: "id-1",
    });
    executeJournalSaveOperation.mockResolvedValue({
      kind: "failed_final",
      resultCode: "SAVE_FAILED",
    });

    await runIdempotentProductionJournalSave({
      viewerEmail: "old@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: { ...PORT, viewerEmail: "old@example.com" } as never,
    });
    await runIdempotentProductionJournalSave({
      viewerEmail: "new@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: { ...PORT, viewerEmail: "new@example.com" } as never,
    });

    expect(executeJournalSaveOperation.mock.calls[0]?.[2]).toMatchObject({
      userId: "firebase:UID-1",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    expect(executeJournalSaveOperation.mock.calls[1]?.[2]).toMatchObject({
      userId: "firebase:UID-1",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
  });

  it("stable-rejected before insert → 0 executeJournalSaveOperation calls", async () => {
    resolveJournalSaveWriteActorKey.mockResolvedValue({
      mode: "stable_rejected",
      reason: "identity_not_bound",
    });
    const res = await runIdempotentProductionJournalSave({
      viewerEmail: "new@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: PORT as never,
    });
    expect(executeJournalSaveOperation).not.toHaveBeenCalled();
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      code: "STABLE_IDENTITY_REQUIRED",
      state: "identity_not_bound",
    });
  });

  it("capability under stable mode uses firebase actorKey (same scope as writes)", async () => {
    getViewerEmailFromCookie.mockResolvedValue("person@example.com");
    isJournalSaveIdempotencyEnabled.mockReturnValue(true);
    resolveJournalSaveWriteActorKey.mockResolvedValue({
      mode: "stable",
      actorKey: "firebase:UID-A",
      firebaseUid: "UID-A",
      identityId: "id-1",
    });
    findRollout.mockResolvedValue({ enabled: true, protocolVersion: 1 });

    const res = await capability.GET();
    expect(await res.json()).toMatchObject({ idempotentSaveEnabled: true });
    expect(findRollout).toHaveBeenCalledWith({
      where: { actorKey: "firebase:UID-A" },
      select: { enabled: true, protocolVersion: true },
    });
  });

  it("capability stable_rejected → fail-closed disabled (no rollout probe)", async () => {
    getViewerEmailFromCookie.mockResolvedValue("person@example.com");
    isJournalSaveIdempotencyEnabled.mockReturnValue(true);
    resolveJournalSaveWriteActorKey.mockResolvedValue({
      mode: "stable_rejected",
      reason: "verified_session_required",
    });

    const res = await capability.GET();
    expect(await res.json()).toMatchObject({ idempotentSaveEnabled: false });
    expect(findRollout).not.toHaveBeenCalled();
  });

  it("recovery lookup remains email-scoped (no historical expansion in X6.3)", async () => {
    getViewerEmailFromCookie.mockResolvedValue("owner@ljd.invalid");
    findOperation.mockResolvedValue(null);
    const res = await lookup.GET(
      new Request(
        `https://ljd.invalid/api/journal/save-operations/01HXSAVEOPERATIONID00000001?requestFingerprint=${"a".repeat(64)}`,
      ),
      { params: Promise.resolve({ saveOperationId: "01HXSAVEOPERATIONID00000001" }) },
    );
    expect(await res.json()).toEqual({ protocolVersion: 1, state: "not_found" });
    expect(findOperation).toHaveBeenCalledWith({
      where: {
        actorKey_saveOperationId: {
          actorKey: "owner@ljd.invalid",
          saveOperationId: "01HXSAVEOPERATIONID00000001",
        },
      },
      select: {
        status: true,
        journalEntryId: true,
        requestFingerprint: true,
        resultCode: true,
      },
    });
    expect(resolveJournalSaveWriteActorKey).not.toHaveBeenCalled();
  });

  it("flag-OFF legacy write path still uses cookie email actorKey", async () => {
    resolveJournalSaveWriteActorKey.mockResolvedValue({
      mode: "legacy",
      actorKey: "person@example.com",
    });
    executeJournalSaveOperation.mockResolvedValue({
      kind: "failed_final",
      resultCode: "SAVE_FAILED",
    });
    await runIdempotentProductionJournalSave({
      viewerEmail: "Person@Example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: PORT as never,
    });
    expect(executeJournalSaveOperation.mock.calls[0]?.[2]).toMatchObject({
      userId: "person@example.com",
    });
  });
});

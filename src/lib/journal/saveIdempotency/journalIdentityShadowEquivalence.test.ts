/**
 * AI-X6.2 write / recovery / capability equivalence.
 *
 * Shadow ON must not change actorKey, Prisma where clauses, status, or body.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewerEmailFromCookie = vi.fn();
const isJournalSaveIdempotencyEnabled = vi.fn();
const findRollout = vi.fn();
const findManyOperations = vi.fn();
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
vi.mock("@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey", () => ({
  resolveJournalSaveWriteActorKey,
  stableJsoWriteRejectHttp: (reason: string) => ({
    status: reason === "verified_session_required" ? 401 : 409,
    body: {
      error: "安定したアカウント識別子を確認できませんでした。",
      code: "STABLE_IDENTITY_REQUIRED",
      state: reason,
    },
  }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    journalSaveIdempotencyRollout: { findUnique: findRollout },
    journalSaveOperation: { findMany: findManyOperations },
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
vi.mock("@/lib/journal/saveIdempotency/assessStableJsoFlagCombination", () => ({
  assessStableJsoFlagCombination: () => ({
    status: "ok",
    writeEnabled: false,
    recoveryEnabled: false,
  }),
}));

const capability = await import("@/app/api/journal/save-capability/route");
const lookup = await import("@/app/api/journal/save-operations/[saveOperationId]/route");
const { runIdempotentProductionJournalSave } = await import(
  "@/lib/journal/saveIdempotency/runIdempotentProductionJournalSave"
);

describe("AI-X6.2 authority equivalence (shadow cannot alter paths)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createPrismaJournalSaveOperationStore.mockReturnValue({ kind: "store" });
    createProductionJournalSavePorts.mockReturnValue({ kind: "ports" });
    observeJournalIdentityShadow.mockResolvedValue(null);
    // X6.2 equivalence assumes legacy write authority (stable-write flag OFF).
    resolveJournalSaveWriteActorKey.mockImplementation(async (email: string) => ({
      mode: "legacy",
      actorKey: email.trim().toLowerCase(),
    }));
  });

  async function capabilitySnapshot() {
    getViewerEmailFromCookie.mockResolvedValue("Person@Example.com");
    isJournalSaveIdempotencyEnabled.mockReturnValue(true);
    findRollout.mockResolvedValue({ enabled: true, protocolVersion: 1 });
    const res = await capability.GET();
    return {
      status: res.status,
      body: await res.json(),
      rolloutWhere: findRollout.mock.calls[0]?.[0],
      observeArgs: observeJournalIdentityShadow.mock.calls[0]?.[0],
    };
  }

  it("capability: shadow report mismatch does not change admission or actorKey", async () => {
    observeJournalIdentityShadow.mockResolvedValue({
      state: "stable_resolved_cookie_not_authorized",
      route: "journal.save_capability",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount: 1,
      cookieActorAuthorized: false,
      cookieActorKind: "unauthorized",
    });
    const withShadow = await capabilitySnapshot();

    observeJournalIdentityShadow.mockResolvedValue(null);
    const shadowNull = await capabilitySnapshot();

    expect(withShadow.status).toBe(shadowNull.status);
    expect(withShadow.body).toEqual(shadowNull.body);
    expect(withShadow.rolloutWhere).toEqual({
      where: { actorKey: "person@example.com" },
      select: { enabled: true, protocolVersion: true },
    });
    expect(shadowNull.rolloutWhere).toEqual(withShadow.rolloutWhere);
    expect(withShadow.observeArgs).toMatchObject({
      route: "journal.save_capability",
      legacyCookieActorKey: "person@example.com",
    });
  });

  it("capability: resolver-style observation error cannot alter response", async () => {
    observeJournalIdentityShadow.mockResolvedValue({
      state: "shadow_observation_error",
      route: "journal.save_capability",
      hasVerifiedSession: false,
      identityBound: false,
      legacyClaimCount: 0,
      cookieActorAuthorized: false,
      cookieActorKind: "unavailable",
    });
    const errored = await capabilitySnapshot();
    observeJournalIdentityShadow.mockResolvedValue(null);
    const baseline = await capabilitySnapshot();
    expect(errored.status).toBe(baseline.status);
    expect(errored.body).toEqual(baseline.body);
  });

  async function lookupSnapshot() {
    getViewerEmailFromCookie.mockResolvedValue("owner@ljd.invalid");
    findManyOperations.mockResolvedValue([
      {
        status: "completed",
        journalEntryId: "entry_1",
        requestFingerprint: "a".repeat(64),
        resultCode: "OK",
      },
    ]);
    const res = await lookup.GET(
      new Request(
        `https://ljd.invalid/api/journal/save-operations/01HXSAVEOPERATIONID00000001?requestFingerprint=${"a".repeat(64)}`,
      ),
      { params: Promise.resolve({ saveOperationId: "01HXSAVEOPERATIONID00000001" }) },
    );
    return {
      status: res.status,
      body: await res.json(),
      where: findManyOperations.mock.calls[0]?.[0],
      observeArgs: observeJournalIdentityShadow.mock.calls[0]?.[0],
    };
  }

  it("recovery: shadow ON uses same email-scoped lookup (no key expansion)", async () => {
    observeJournalIdentityShadow.mockResolvedValue({
      state: "stable_resolved_cookie_not_authorized",
      route: "journal.save_operations.lookup",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount: 1,
      cookieActorAuthorized: false,
      cookieActorKind: "unauthorized",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    const withShadow = await lookupSnapshot();

    observeJournalIdentityShadow.mockResolvedValue(null);
    const baseline = await lookupSnapshot();

    expect(withShadow.status).toBe(baseline.status);
    expect(withShadow.body).toEqual(baseline.body);
    expect(withShadow.where).toEqual({
      where: {
        saveOperationId: "01HXSAVEOPERATIONID00000001",
        actorKey: { in: ["owner@ljd.invalid"] },
      },
      select: {
        status: true,
        journalEntryId: true,
        requestFingerprint: true,
        resultCode: true,
      },
      take: 2,
    });
    expect(baseline.where).toEqual(withShadow.where);
    expect(withShadow.observeArgs).toMatchObject({
      route: "journal.save_operations.lookup",
      legacyCookieActorKey: "owner@ljd.invalid",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
  });

  it("write-equivalence: JSO userId remains normalized cookie email with shadow ON", async () => {
    executeJournalSaveOperation.mockResolvedValue({
      kind: "failed_final",
      resultCode: "SAVE_FAILED",
    });

    observeJournalIdentityShadow.mockResolvedValue({
      state: "stable_resolved_cookie_not_authorized",
      route: "journal.save",
      hasVerifiedSession: true,
      identityBound: true,
      legacyClaimCount: 1,
      cookieActorAuthorized: false,
      cookieActorKind: "unauthorized",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });

    const portContext = {
      viewerEmail: "Person@Example.com",
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

    const resOn = await runIdempotentProductionJournalSave({
      viewerEmail: "Person@Example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: portContext as never,
    });

    const execOn = executeJournalSaveOperation.mock.calls[0];
    expect(execOn?.[2]).toMatchObject({
      userId: "person@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    expect(observeJournalIdentityShadow).toHaveBeenCalledWith({
      route: "journal.save",
      legacyCookieActorKey: "person@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });

    observeJournalIdentityShadow.mockResolvedValue(null);
    executeJournalSaveOperation.mockClear();

    const resOff = await runIdempotentProductionJournalSave({
      viewerEmail: "Person@Example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: portContext as never,
    });

    const execOff = executeJournalSaveOperation.mock.calls[0];
    expect(execOff?.[2]).toMatchObject({
      userId: "person@example.com",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
    });
    expect(resOn.status).toBe(resOff.status);
    expect(await resOn.json()).toEqual(await resOff.json());
  });

  it("write path: observe throw must not break legacy save authority", async () => {
    observeJournalIdentityShadow.mockRejectedValue(
      new Error("injected boom secret@example.com"),
    );
    executeJournalSaveOperation.mockResolvedValue({
      kind: "failed_final",
      resultCode: "SAVE_FAILED",
    });

    const res = await runIdempotentProductionJournalSave({
      viewerEmail: "owner@ljd.invalid",
      saveOperationId: "01HXSAVEOPERATIONID00000001",
      requestFingerprint: "f".repeat(64),
      entryDateYmd: "2026-01-01",
      hasPhoto: false,
      portContext: {
        viewerEmail: "owner@ljd.invalid",
        profileId: "p1",
        content: "x",
        mood: "calm",
        companionType: "owl",
        activity: "record_anyway",
        designTheme: "simple_plain",
        includeInBook: true,
        photoPatch: { kind: "none" },
        parsedEntryDate: new Date("2026-01-01T00:00:00.000Z"),
      } as never,
    });

    expect(executeJournalSaveOperation.mock.calls[0]?.[2]).toMatchObject({
      userId: "owner@ljd.invalid",
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("injected");
    expect(JSON.stringify(body)).not.toContain("secret@example.com");
    expect(body.code).toBe("SAVE_OPERATION_FAILED");
  });
});

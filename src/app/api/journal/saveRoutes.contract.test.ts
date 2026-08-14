import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewerEmailFromCookie = vi.fn();
const isJournalSaveIdempotencyEnabled = vi.fn();
const findRollout = vi.fn();
const findOperation = vi.fn();

vi.mock("@/lib/auth/viewer", () => ({
  getViewerEmailFromCookie,
  normalizeEmail: (value: string) => value.trim().toLowerCase(),
}));
vi.mock("@/lib/journal/saveIdempotency/journalSaveIdempotencyGate", () => ({
  isJournalSaveIdempotencyEnabled,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    journalSaveIdempotencyRollout: { findUnique: findRollout },
    journalSaveOperation: { findUnique: findOperation },
  },
}));

const capability = await import("@/app/api/journal/save-capability/route");
const lookup = await import("@/app/api/journal/save-operations/[saveOperationId]/route");

describe("4B-4AI-1 capability + lookup route contracts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses cookie identity only and fails capability closed", async () => {
    getViewerEmailFromCookie.mockResolvedValue(null);
    const unauthorized = await capability.GET();
    expect(unauthorized.status).toBe(401);
    expect(await unauthorized.json()).toMatchObject({ code: "AUTH_REQUIRED" });

    getViewerEmailFromCookie.mockResolvedValue("Person@Example.com");
    isJournalSaveIdempotencyEnabled.mockReturnValue(false);
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
      lookupSupported: false,
    });
    expect(findRollout).not.toHaveBeenCalled();

    isJournalSaveIdempotencyEnabled.mockReturnValue(true);
    findRollout.mockRejectedValue(new Error("db down"));
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
      foregroundRecoverySupported: false,
    });
  });

  it("requires a supported enabled row in addition to global ON", async () => {
    getViewerEmailFromCookie.mockResolvedValue("Person@Example.com");
    isJournalSaveIdempotencyEnabled.mockReturnValue(true);
    findRollout.mockResolvedValue({ enabled: true, protocolVersion: 1 });
    expect(await (await capability.GET()).json()).toEqual({
      protocolVersion: 1,
      idempotentSaveEnabled: true,
      lookupSupported: true,
      foregroundRecoverySupported: true,
      automaticBackgroundRetry: false,
    });
    expect(findRollout).toHaveBeenCalledWith({
      where: { actorKey: "person@example.com" },
      select: { enabled: true, protocolVersion: true },
    });
  });

  it("validates lookup input and hides other actors through scoped query", async () => {
    getViewerEmailFromCookie.mockResolvedValue(null);
    const unauth = await lookup.GET(
      new Request("https://ljd.invalid/api/journal/save-operations/01HXSAVEOPERATIONID00000001?requestFingerprint=x"),
      { params: Promise.resolve({ saveOperationId: "01HXSAVEOPERATIONID00000001" }) },
    );
    expect(unauth.status).toBe(401);
    expect(await unauth.json()).toMatchObject({ code: "AUTH_REQUIRED" });

    getViewerEmailFromCookie.mockResolvedValue("owner@ljd.invalid");
    const invalid = await lookup.GET(
      new Request("https://ljd.invalid/api/journal/save-operations/bad?requestFingerprint=x"),
      { params: Promise.resolve({ saveOperationId: "bad" }) },
    );
    expect(invalid.status).toBe(400);
    expect(findOperation).not.toHaveBeenCalled();

    findOperation.mockResolvedValue(null);
    const response = await lookup.GET(
      new Request(
        `https://ljd.invalid/api/journal/save-operations/01HXSAVEOPERATIONID00000001?requestFingerprint=${"a".repeat(64)}`,
      ),
      { params: Promise.resolve({ saveOperationId: "01HXSAVEOPERATIONID00000001" }) },
    );
    expect(await response.json()).toEqual({ protocolVersion: 1, state: "not_found" });
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
  });

  it("allows owner recovery after rollout/global OFF because lookup is not new admission", async () => {
    getViewerEmailFromCookie.mockResolvedValue("owner@ljd.invalid");
    findOperation.mockResolvedValue({
      status: "completed",
      journalEntryId: "entry_1",
      requestFingerprint: "a".repeat(64),
      resultCode: "OK",
    });
    const response = await lookup.GET(
      new Request(
        `https://ljd.invalid/api/journal/save-operations/01HXSAVEOPERATIONID00000001?requestFingerprint=${"a".repeat(64)}`,
      ),
      { params: Promise.resolve({ saveOperationId: "01HXSAVEOPERATIONID00000001" }) },
    );
    expect(await response.json()).toEqual({
      protocolVersion: 1,
      state: "completed",
      entryId: "entry_1",
    });
  });
});

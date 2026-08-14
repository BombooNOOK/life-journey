/**
 * 4B-4Y Production wiring helpers (gate / contract / fingerprint / HTTP map).
 * Does not hit Production DB.
 */

import { describe, expect, it } from "vitest";

import {
  isJournalSaveIdempotencyEnabled,
  JOURNAL_SAVE_IDEMPOTENCY_FLAG,
} from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";
import { mapIdempotencyOutcomeToStatus } from "@/lib/journal/saveIdempotency/runIdempotentProductionJournalSave";
import {
  buildProductionJournalSaveFingerprint,
  photoIdentityFromPatch,
  sha256Hex,
} from "@/lib/journal/saveIdempotency/productionRequestFingerprint";
import { parseSaveOperationIdFromBody } from "@/lib/journal/saveIdempotency/saveOperationId";
import type { ExecuteJournalSaveOperationOutcome } from "@/lib/journal/saveIdempotency/types";

describe("journalSaveIdempotencyGate (4B-4Y)", () => {
  it("defaults OFF when unset", () => {
    expect(isJournalSaveIdempotencyEnabled({})).toBe(false);
    expect(isJournalSaveIdempotencyEnabled({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "" })).toBe(
      false,
    );
    expect(isJournalSaveIdempotencyEnabled({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "true" })).toBe(
      false,
    );
  });

  it("enables only on YES or 1", () => {
    expect(
      isJournalSaveIdempotencyEnabled({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "YES" }),
    ).toBe(true);
    expect(isJournalSaveIdempotencyEnabled({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "1" })).toBe(
      true,
    );
  });
});

describe("parseSaveOperationIdFromBody (4B-4Y)", () => {
  it("MISSING when absent (legacy-compatible)", () => {
    expect(parseSaveOperationIdFromBody({ content: "x" })).toEqual({
      ok: false,
      code: "MISSING",
      detail: "saveOperationId absent",
    });
    const empty = parseSaveOperationIdFromBody({ saveOperationId: "" });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe("MISSING");
    const nul = parseSaveOperationIdFromBody({ saveOperationId: null });
    expect(nul.ok).toBe(false);
    if (!nul.ok) expect(nul.code).toBe("MISSING");
  });

  it("INVALID when present but bad", () => {
    const short = parseSaveOperationIdFromBody({ saveOperationId: "short" });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.code).toBe("INVALID");
    const bad = parseSaveOperationIdFromBody({
      saveOperationId: "!!!bad!!!bad!!!bad!!!",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("INVALID");
    const num = parseSaveOperationIdFromBody({ saveOperationId: 123 });
    expect(num.ok).toBe(false);
    if (!num.ok) expect(num.code).toBe("INVALID");
  });

  it("accepts opaque stable ids", () => {
    const id = "01HXSAVEOPERATIONID00000001";
    expect(parseSaveOperationIdFromBody({ saveOperationId: id })).toEqual({
      ok: true,
      saveOperationId: id,
    });
  });
});

describe("productionRequestFingerprint (4B-4Y)", () => {
  const base = {
    content: "hello forest",
    entryDate: "2026-08-13",
    profileId: "prof_1",
    mood: "calm",
    activity: "record_anyway",
    companionType: "owl",
    designTheme: "simple_plain",
    contentFontMode: "standard",
    includeInBook: true,
    photoIdentity: "none",
  };

  it("is deterministic and excludes raw body", () => {
    const a = buildProductionJournalSaveFingerprint(base);
    const b = buildProductionJournalSaveFingerprint(base);
    expect(a).toBe(b);
    expect(a).not.toContain("hello forest");
    expect(a).toContain(sha256Hex("hello forest"));
  });

  it("changes when content or photo identity changes", () => {
    const a = buildProductionJournalSaveFingerprint(base);
    const b = buildProductionJournalSaveFingerprint({ ...base, content: "other" });
    const c = buildProductionJournalSaveFingerprint({
      ...base,
      photoIdentity: photoIdentityFromPatch({
        kind: "set",
        dataUrl: "data:image/png;base64,aaa",
      }),
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("mapIdempotencyOutcomeToStatus (4B-4Y)", () => {
  const cases: Array<[ExecuteJournalSaveOperationOutcome, number]> = [
    [
      {
        kind: "completed",
        journalEntryId: "e1",
        reusedExisting: false,
        donguriCharged: true,
        donguriAlreadyCharged: false,
      },
      200,
    ],
    [
      {
        kind: "processing",
        checkpoint: "entry_created",
        detail: "busy",
      },
      202,
    ],
    [{ kind: "idempotency_conflict", detail: "fp" }, 409],
    [
      {
        kind: "failed_final",
        resultCode: "ACORN_INSUFFICIENT",
        journalEntryId: null,
      },
      402,
    ],
    [
      {
        kind: "failed_final",
        resultCode: "INTERNAL",
        journalEntryId: null,
      },
      500,
    ],
  ];

  for (const [outcome, status] of cases) {
    it(`${outcome.kind} → ${status}`, () => {
      expect(mapIdempotencyOutcomeToStatus(outcome)).toBe(status);
    });
  }
});

/**
 * Compatibility policy (route behavior contract):
 * feature OFF → legacy
 * feature ON + MISSING id → legacy (never invent server operation ids)
 * feature ON + INVALID → 400
 * feature ON + valid → JSO path
 */
describe("legacy compatibility policy (4B-4Y)", () => {
  function choosePath(env: Record<string, string | undefined>, body: unknown) {
    if (!isJournalSaveIdempotencyEnabled(env)) return "legacy";
    const parsed = parseSaveOperationIdFromBody(body);
    if (!parsed.ok && parsed.code === "INVALID") return "reject_400";
    if (!parsed.ok && parsed.code === "MISSING") return "legacy";
    return "jso";
  }

  it("feature OFF keeps legacy even with saveOperationId", () => {
    expect(
      choosePath({}, { saveOperationId: "01HXSAVEOPERATIONID00000001" }),
    ).toBe("legacy");
  });

  it("feature ON without id stays legacy", () => {
    expect(
      choosePath({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "YES" }, { content: "x" }),
    ).toBe("legacy");
  });

  it("feature ON with invalid id rejects", () => {
    expect(
      choosePath({ [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "YES" }, { saveOperationId: "x" }),
    ).toBe("reject_400");
  });

  it("feature ON with valid id uses JSO", () => {
    expect(
      choosePath(
        { [JOURNAL_SAVE_IDEMPOTENCY_FLAG]: "YES" },
        { saveOperationId: "01HXSAVEOPERATIONID00000001" },
      ),
    ).toBe("jso");
  });
});

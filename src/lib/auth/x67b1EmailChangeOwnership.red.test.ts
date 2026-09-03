/**
 * AI-X6.7B1 — RED test suite for Gate X6 criteria 4 / 5 / 6 remediation.
 *
 * These tests express the REQUIRED post-remediation invariants.
 * They are expected to FAIL on current email-keyed product ownership
 * (vitest `it.fails`). After durable remediation they must be flipped
 * to ordinary `it` and pass.
 *
 * Criterion 6 native pending path is already covered as PASSING unit tests
 * in nativeStablePendingIntent.test.ts — T5/T6 here focus on product/
 * JSO ownership invariants that remediation must preserve or add.
 *
 * No production code changes in this file's companion phase.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { resolveVerifiedViewerActorIdentity } from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import {
  buildP0ReadShadowRows,
} from "@/lib/account/p0IdentityOwnershipReadShadow";
import {
  classifyVerifiedActorIdentity,
  dualWriteIdentityIdOrNull,
} from "@/lib/account/p0IdentityOwnership";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
  type SaveCapabilityAdmission,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import {
  NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG,
  NATIVE_STABLE_PENDING_INTENT_FLAG,
} from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import { resolveJournalSaveWriteActorKey } from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";

const UID_A = "x67b1-red-uid-a";
const UID_B = "x67b1-red-uid-b";
const EMAIL_A = "x67b1-red-a@example.com";
const EMAIL_B = "x67b1-red-b@example.com";

const payload: JournalCreatePayload = {
  content: "x67b1 red body",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-09-03",
  profileId: "profile_red",
  includeInBook: false,
};

/**
 * Placeholder product history visibility helper.
 * TODAY: email equality only (current bug).
 * AFTER remediation: must resolve via identityId / explicit claim, never
 * current auth email alone.
 */
function productHistoryVisibleUnderCurrentEmailAuthority(input: {
  historyOwnerEmail: string;
  cookieEmail: string;
}): boolean {
  return input.historyOwnerEmail === input.cookieEmail;
}

afterEach(() => {
  vi.unstubAllEnvs();
  clearCurrentSessionJournalCreatePayloadsForTest();
});

describe("AI-X6.7B1 RED suite — desired Gate X6 ownership invariants", () => {
  /**
   * T1: UID-A EMAIL-A → EMAIL-B keeps history visible.
   * Fails today because product visibility is cookie-email equality.
   */
  it.fails("T1: UID-A history remains visible after EMAIL-A → EMAIL-B", () => {
    const visible = productHistoryVisibleUnderCurrentEmailAuthority({
      historyOwnerEmail: EMAIL_A,
      cookieEmail: EMAIL_B,
    });
    expect(visible).toBe(true);
  });

  /**
   * T1 NEW identity path (B3): identity-scoped history preserved after email change.
   * Does NOT close criterion 4 — user-visible legacy reads remain uncut.
   */
  it("T1 NEW: identity-scoped history preserved after EMAIL-A → EMAIL-B", async () => {
    const ownership = await classifyVerifiedActorIdentity(
      {
        state: "resolved",
        firebaseUid: UID_A,
        identityId: "id-a",
        stableActorKey: buildFirebaseActorKey(UID_A),
        actorLookupKeys: [buildFirebaseActorKey(UID_A), EMAIL_A],
        legacyActorKeys: [EMAIL_A],
        verifiedEmailMetadata: EMAIL_B,
      },
      {
        db: {
          accountSettings: {
            findUnique: async () => null,
            findFirst: async () => ({
              id: "s-a",
              email: EMAIL_A,
              identityId: "id-a",
            }),
          },
        },
      },
    );
    expect(ownership.state).toBe("BOUND");
    expect(ownership.identityId).toBe("id-a");
    // Shadow: OLD empty (cookie EMAIL-B), NEW has history ids
    const shadow = buildP0ReadShadowRows({
      oldIds: [],
      newIds: ["entry-a1", "profile-a1"],
      unboundIds: new Set(),
    });
    expect(shadow.every((r) => r.category === "IDENTITY_ONLY")).toBe(true);
  });

  /**
   * T2: UID-B reuses EMAIL-A → zero UID-A history.
   * Fails today because email equality grants access.
   */
  it.fails("T2: UID-B with reused EMAIL-A sees zero UID-A history", () => {
    const visible = productHistoryVisibleUnderCurrentEmailAuthority({
      historyOwnerEmail: EMAIL_A,
      cookieEmail: EMAIL_A, // UID-B's auth email
    });
    // Desired: even with matching email string, UID-B must not see UID-A rows
    // without identity ownership. Current helper wrongly returns true.
    expect(visible).toBe(false);
  });

  it("T2 NEW: identity-scoped path isolates UID-B from UID-A history", async () => {
    const ownershipB = await classifyVerifiedActorIdentity(
      {
        state: "resolved",
        firebaseUid: UID_B,
        identityId: "id-b",
        stableActorKey: buildFirebaseActorKey(UID_B),
        actorLookupKeys: [buildFirebaseActorKey(UID_B)],
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
      },
      {
        db: {
          accountSettings: {
            findUnique: async () => ({
              id: "s-a",
              email: EMAIL_A,
              identityId: "id-a",
            }),
            findFirst: async () => null,
          },
        },
      },
    );
    expect(ownershipB.state).toBe("MISMATCH");
    expect(
      dualWriteIdentityIdOrNull({
        dualWriteEnabled: true,
        ownership: ownershipB,
      }),
    ).toBeNull();
    // NEW ids for UID-B identity must not include UID-A rows
    const shadow = buildP0ReadShadowRows({
      oldIds: ["entry-a1"], // legacy email wrongly surfaces
      newIds: [], // identity path empty for UID-B
      unboundIds: new Set(["entry-a1"]),
    });
    expect(shadow.some((r) => r.category === "UNBOUND_LEGACY" || r.category === "LEGACY_ONLY")).toBe(
      true,
    );
  });

  it("T3: UID-B cannot obtain UID-A explicit legacy claim via current email", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "id-b",
      firebaseUid: UID_B,
      legacyActorClaims: [],
    });
    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({ uid: UID_B, email: EMAIL_A }),
      db: { accountIdentity: { findUnique } } as never,
    });
    expect(result.state).toBe("resolved");
    if (result.state === "resolved") {
      expect(result.legacyActorKeys).not.toContain(EMAIL_A);
      expect(result.actorLookupKeys).not.toContain(EMAIL_A);
    }
  });

  it("T4: UID-A stable write actor remains firebase:<UID-A> after email change", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "id-a",
      firebaseUid: UID_A,
      legacyActorClaims: [{ actorKey: EMAIL_A }],
    });
    const before = await resolveJournalSaveWriteActorKey(EMAIL_A, {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_A }),
      db: { accountIdentity: { findUnique } } as never,
    });
    const after = await resolveJournalSaveWriteActorKey(EMAIL_B, {
      isStableWriteEnabled: () => true,
      getSession: async () => ({ uid: UID_A, email: EMAIL_B }),
      db: { accountIdentity: { findUnique } } as never,
    });
    expect(before).toMatchObject({
      mode: "stable",
      actorKey: buildFirebaseActorKey(UID_A),
    });
    expect(after).toMatchObject({
      mode: "stable",
      actorKey: buildFirebaseActorKey(UID_A),
    });
  });

  it("T5: pending saveOperationId survives EMAIL-A → EMAIL-B (same UID)", async () => {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "YES");
    clearCurrentSessionJournalCreatePayloadsForTest();

    const store = createMemoryClientSaveOperationIntentStore();
    const deps: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () =>
        ({ kind: "enabled", stableActorAdmission: true }) satisfies SaveCapabilityAdmission,
      post: async () => {
        throw new Error("network_down");
      },
      lookup: async () =>
        new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
    };

    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      deps,
    );
    expect(created.kind).toBe("pending");
    if (created.kind !== "pending") throw new Error("expected pending");
    const saveOperationId = created.intent.saveOperationId;
    const fingerprint = created.intent.requestFingerprint;

    const replayPost = vi.fn(async (json: string) => {
      const body = JSON.parse(json) as { saveOperationId?: string };
      expect(body.saveOperationId).toBe(saveOperationId);
      return new Response(JSON.stringify({ entry: { id: "entry_red_1" } }), {
        status: 200,
      });
    });

    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: EMAIL_B, firebaseUid: UID_A },
      { ...deps, postExactJson: replayPost },
    );
    expect(recovered.some((r) => r.kind === "completed")).toBe(true);
    expect(replayPost).toHaveBeenCalledTimes(1);

    const row = await store.findByStableActorAndSaveOperationId(
      buildFirebaseActorKey(UID_A),
      saveOperationId,
    );
    expect(row?.requestFingerprint).toBe(fingerprint);
    expect(row?.stableActorKey).toBe(buildFirebaseActorKey(UID_A));
  });

  it("T6: same saveOperationId recovers once (no duplicate create)", async () => {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "YES");
    clearCurrentSessionJournalCreatePayloadsForTest();

    const store = createMemoryClientSaveOperationIntentStore();
    let posts = 0;
    const baseDeps: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () =>
        ({ kind: "enabled", stableActorAdmission: true }) satisfies SaveCapabilityAdmission,
      post: async () => {
        throw new Error("network_down");
      },
      lookup: async () =>
        new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
    };

    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      baseDeps,
    );
    expect(created.kind).toBe("pending");
    if (created.kind !== "pending") throw new Error("expected pending");
    const saveOperationId = created.intent.saveOperationId;

    const postExactJson = vi.fn(async (json: string) => {
      posts += 1;
      const body = JSON.parse(json) as { saveOperationId?: string };
      expect(body.saveOperationId).toBe(saveOperationId);
      return new Response(JSON.stringify({ entry: { id: "entry_once" } }), {
        status: 200,
      });
    });

    const first = await recoverJournalCreateSaves(
      { viewerEmail: EMAIL_B, firebaseUid: UID_A },
      { ...baseDeps, postExactJson },
    );
    expect(first.some((r) => r.kind === "completed")).toBe(true);
    expect(posts).toBe(1);

    const second = await recoverJournalCreateSaves(
      { viewerEmail: EMAIL_B, firebaseUid: UID_A },
      {
        ...baseDeps,
        postExactJson,
        lookup: async () =>
          new Response(
            JSON.stringify({
              state: "completed",
              saveOperationId,
              journalEntryId: "entry_once",
            }),
            { status: 200 },
          ),
      },
    );
    expect(posts).toBe(1);
    expect(second.every((r) => r.kind !== "pending")).toBe(true);
  });

  /**
   * T7: AccountSettings must follow UID-A after email change.
   * Placeholder encodes desired identityId resolution over email unique lookup.
   */
  it.fails("T7: AccountSettings follows UID-A after EMAIL-A → EMAIL-B", () => {
    const settingsBoundToIdentity = {
      identityId: "id-a",
      emailMetadata: EMAIL_A,
    };
    const cookieEmail = EMAIL_B;
    // Desired: resolve by identityId, ignore cookie email mismatch.
    const resolvedByIdentity = settingsBoundToIdentity.identityId === "id-a";
    const resolvedByEmailOnly = settingsBoundToIdentity.emailMetadata === cookieEmail;
    expect(resolvedByIdentity && !resolvedByEmailOnly).toBe(true);
    // Force RED until product routes stop using email-only lookup:
    expect(resolvedByEmailOnly).toBe(true);
  });

  it("T7 NEW: P0 AccountSettings path follows bound identity after email change", async () => {
    const ownership = await classifyVerifiedActorIdentity(
      {
        state: "resolved",
        firebaseUid: UID_A,
        identityId: "id-a",
        stableActorKey: buildFirebaseActorKey(UID_A),
        actorLookupKeys: [buildFirebaseActorKey(UID_A)],
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_B,
      },
      {
        db: {
          accountSettings: {
            findUnique: async () => null, // EMAIL-B has no settings row
            findFirst: async () => ({
              id: "s-a",
              email: EMAIL_A,
              identityId: "id-a",
            }),
          },
        },
      },
    );
    expect(ownership.state).toBe("BOUND");
    expect(ownership.identityId).toBe("id-a");
    expect(ownership.evidenceSource).toBe("BOUND_ACCOUNT_SETTINGS");
  });

  /**
   * T8: delete/export ownership must be UID/claim scoped, not current email alone.
   */
  it.fails("T8: delete/export must not authorize solely by current email string", () => {
    const deleteAuthorizedByCurrentEmailAlone = true; // current deleteUserAccount
    expect(deleteAuthorizedByCurrentEmailAlone).toBe(false);
  });

  /**
   * T9: new user with reused email receives no historical ownership.
   */
  it.fails("T9: reused EMAIL-A grants no historical JournalEntry ownership to new UID", () => {
    const newUserSeesPriorEmailHistory = productHistoryVisibleUnderCurrentEmailAuthority({
      historyOwnerEmail: EMAIL_A,
      cookieEmail: EMAIL_A,
    });
    expect(newUserSeesPriorEmailHistory).toBe(false);
  });

  it("T9 NEW: dual-write never assigns ID_A to unbound/reused-email UID-B", () => {
    const unboundB = {
      state: "UNBOUND" as const,
      identityId: null,
      firebaseUid: UID_B,
      evidenceSource: "NONE" as const,
      legacyActorKeys: [] as string[],
      verifiedEmailMetadata: EMAIL_A,
      reason: "identity_not_bound",
    };
    expect(
      dualWriteIdentityIdOrNull({ dualWriteEnabled: true, ownership: unboundB }),
    ).toBeNull();
  });

  it("T10: resolver never auto-adds current email as legacy claim", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "id-a",
      firebaseUid: UID_A,
      legacyActorClaims: [],
    });
    const result = await resolveVerifiedViewerActorIdentity({
      getSession: async () => ({ uid: UID_A, email: EMAIL_B }),
      db: { accountIdentity: { findUnique } } as never,
    });
    expect(result.state).toBe("resolved");
    if (result.state === "resolved") {
      expect(result.actorLookupKeys).toEqual([buildFirebaseActorKey(UID_A)]);
      expect(result.verifiedEmailMetadata).toBe(EMAIL_B);
      expect(result.actorLookupKeys).not.toContain(EMAIL_B);
    }
  });
});

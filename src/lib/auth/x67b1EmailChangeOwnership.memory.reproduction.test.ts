/**
 * AI-X6.7B1 — In-memory Criterion 4 / 5 failure reproduction.
 *
 * Mirrors current product ownership: cookie/viewer email string equality.
 * No Production DB. No Docker required. Complements the disposable-Postgres
 * integration file when local Postgres is unavailable.
 */

import { describe, expect, it } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";

type Row = { id: string; email: string; ownerUid?: string };

/** Current JournalEntry/Profile/donguri listing authority (route pattern). */
function listByCookieEmail(rows: Row[], cookieEmail: string): Row[] {
  return rows.filter((r) => r.email === cookieEmail);
}

describe("AI-X6.7B1 in-memory email ownership failure reproduction", () => {
  const UID_A = "uid-a";
  const UID_B = "uid-b";
  const EMAIL_A = "a@example.com";
  const EMAIL_B = "b@example.com";

  const journalOwnedByA: Row[] = [
    { id: "je-1", email: EMAIL_A, ownerUid: UID_A },
  ];
  const profilesOwnedByA: Row[] = [
    { id: "pf-1", email: EMAIL_A, ownerUid: UID_A },
  ];
  const settingsOwnedByA: Row[] = [
    { id: "as-1", email: EMAIL_A, ownerUid: UID_A },
  ];
  const donguriOwnedByA: Row[] = [
    { id: "dg-1", email: EMAIL_A, ownerUid: UID_A },
  ];
  const stableJsoByActor = new Map<string, string[]>([
    [buildFirebaseActorKey(UID_A), ["sop-1"]],
  ]);
  const legacyClaimsByUid = new Map<string, string[]>([[UID_A, [EMAIL_A]]]);

  it("C4 FAIL: UID-A with EMAIL-B cookie loses email-keyed history visibility", () => {
    expect(listByCookieEmail(journalOwnedByA, EMAIL_A)).toHaveLength(1);
    expect(listByCookieEmail(journalOwnedByA, EMAIL_B)).toHaveLength(0);
    expect(listByCookieEmail(profilesOwnedByA, EMAIL_B)).toHaveLength(0);
    expect(listByCookieEmail(settingsOwnedByA, EMAIL_B)).toHaveLength(0);
    expect(listByCookieEmail(donguriOwnedByA, EMAIL_B)).toHaveLength(0);
    // Physical rows still exist under EMAIL-A.
    expect(journalOwnedByA).toHaveLength(1);
  });

  it("C5 FAIL: UID-B with reused EMAIL-A cookie sees UID-A product history", () => {
    expect(listByCookieEmail(journalOwnedByA, EMAIL_A).map((r) => r.id)).toEqual([
      "je-1",
    ]);
    expect(listByCookieEmail(profilesOwnedByA, EMAIL_A).map((r) => r.id)).toEqual([
      "pf-1",
    ]);
    expect(listByCookieEmail(settingsOwnedByA, EMAIL_A).map((r) => r.id)).toEqual([
      "as-1",
    ]);
    expect(listByCookieEmail(donguriOwnedByA, EMAIL_A).map((r) => r.id)).toEqual([
      "dg-1",
    ]);
  });

  it("C5 MIXED: UID-B does not inherit UID-A stable JSO or legacy claim", () => {
    expect(stableJsoByActor.get(buildFirebaseActorKey(UID_B)) ?? []).toEqual([]);
    expect(stableJsoByActor.get(buildFirebaseActorKey(UID_A))).toEqual(["sop-1"]);
    expect(legacyClaimsByUid.get(UID_B) ?? []).not.toContain(EMAIL_A);
    expect(legacyClaimsByUid.get(UID_A)).toContain(EMAIL_A);
  });
});

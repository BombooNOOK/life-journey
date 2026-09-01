import { describe, expect, it } from "vitest";

import {
  ACCOUNT_IDENTITY_EMAIL_STATUS,
  isAccountIdentityEmailStatus,
} from "@/lib/auth/accountIdentityEmailStatus";
import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { buildIdentityActorLookupKeys } from "@/lib/auth/identityActorLookupKeys";

describe("buildFirebaseActorKey (AI-8.2)", () => {
  it("derives firebase:<UID> from AccountIdentity.firebaseUid", () => {
    expect(buildFirebaseActorKey("UID-A")).toBe("firebase:UID-A");
  });
});

describe("buildIdentityActorLookupKeys", () => {
  it("includes derived firebase key and explicit legacy claims", () => {
    expect(
      buildIdentityActorLookupKeys("UID-A", [
        { actorKey: "old@example.com" },
        { actorKey: "earlier@example.com" },
      ]),
    ).toEqual([
      "firebase:UID-A",
      "old@example.com",
      "earlier@example.com",
    ]);
  });

  it("does not implicitly include current auth email", () => {
    const currentAuthEmail = "old@example.com";
    const keys = buildIdentityActorLookupKeys("UID-B", []);
    expect(keys).toEqual(["firebase:UID-B"]);
    expect(keys).not.toContain(currentAuthEmail);
  });

  it("UID-A claim vs UID-B auth-email-only reuse: disjoint lookup sets", () => {
    const uidAKeys = buildIdentityActorLookupKeys("UID-A", [
      { actorKey: "old@example.com" },
    ]);
    const uidBKeys = buildIdentityActorLookupKeys("UID-B", []);
    // UID-B may use old@ as current Firebase auth email, but without a claim
    // it must not see historical old@ actorKey rows.
    expect(uidAKeys).toEqual(["firebase:UID-A", "old@example.com"]);
    expect(uidBKeys).toEqual(["firebase:UID-B"]);
    expect(uidBKeys).not.toContain("old@example.com");
  });

  it("allows multiple legacy claims for one identity", () => {
    const keys = buildIdentityActorLookupKeys("UID-A", [
      { actorKey: "a@example.com" },
      { actorKey: "b@example.com" },
      { actorKey: "c@example.com" },
    ]);
    expect(keys).toHaveLength(4);
    expect(keys[0]).toBe("firebase:UID-A");
    expect(keys.slice(1)).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });
});

describe("AccountIdentityEmail status lifecycle representation", () => {
  it("allows multiple retired emails conceptually (no one-retired uniqueness)", () => {
    const lifecycle = [
      { emailNormalized: "a@example.com", status: ACCOUNT_IDENTITY_EMAIL_STATUS.retired },
      { emailNormalized: "b@example.com", status: ACCOUNT_IDENTITY_EMAIL_STATUS.retired },
      { emailNormalized: "c@example.com", status: ACCOUNT_IDENTITY_EMAIL_STATUS.primary },
    ];
    const retired = lifecycle.filter(
      (r) => r.status === ACCOUNT_IDENTITY_EMAIL_STATUS.retired,
    );
    const primary = lifecycle.filter(
      (r) => r.status === ACCOUNT_IDENTITY_EMAIL_STATUS.primary,
    );
    expect(retired).toHaveLength(2);
    expect(primary).toHaveLength(1);
    expect(isAccountIdentityEmailStatus("primary")).toBe(true);
    expect(isAccountIdentityEmailStatus("retired")).toBe(true);
    expect(isAccountIdentityEmailStatus("active")).toBe(false);
  });
});

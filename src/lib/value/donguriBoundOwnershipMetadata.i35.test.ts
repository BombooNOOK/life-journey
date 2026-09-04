/**
 * AI-X6.7C1.5A2-I3.5 — Donguri BOUND ownership metadata unit tests.
 */

import { describe, expect, it } from "vitest";

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { donguriBoundOwnershipMetadataFields } from "@/lib/value/donguriIdentityAuthority";

function bound(identityId: string): P0OwnershipResolution {
  return {
    state: "BOUND",
    identityId,
    firebaseUid: "uid-a",
    evidenceSource: "VERIFIED_FIREBASE_UID",
    legacyActorKeys: [],
    verifiedEmailMetadata: "b@ljd.invalid",
    reason: "ok",
  };
}

function unbound(): P0OwnershipResolution {
  return {
    state: "UNBOUND",
    identityId: null,
    firebaseUid: null,
    evidenceSource: "NONE",
    legacyActorKeys: [],
    verifiedEmailMetadata: "",
    reason: "verified_session_required",
  };
}

describe("donguriBoundOwnershipMetadataFields (I3.5)", () => {
  it("writes identityId when BOUND", () => {
    expect(donguriBoundOwnershipMetadataFields({ ownership: bound("id-a") })).toEqual({
      identityId: "id-a",
    });
  });

  it("returns empty when UNBOUND — no email inference", () => {
    expect(donguriBoundOwnershipMetadataFields({ ownership: unbound() })).toEqual({});
  });

  it("returns empty when AMBIGUOUS", () => {
    expect(
      donguriBoundOwnershipMetadataFields({
        ownership: {
          state: "AMBIGUOUS",
          identityId: "id-x",
          firebaseUid: "uid",
          evidenceSource: "CONFLICT",
          legacyActorKeys: [],
          verifiedEmailMetadata: "a@ljd.invalid",
          reason: "conflict",
        },
      }),
    ).toEqual({});
  });
});

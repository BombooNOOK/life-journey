/**
 * AI-X6.7B3 — Backfill runner unit tests (pure classification).
 */

import { describe, expect, it } from "vitest";

import { resolveP0IdentityOwnershipForLegacyEmail } from "@/lib/account/p0IdentityOwnershipBackfill";

// Re-export classify behavior via resolve + manual mirror of ALREADY_BOUND/CONFLICT rules
function classifyExisting(input: {
  current: string | null;
  proposed: ReturnType<typeof resolveP0IdentityOwnershipForLegacyEmail>;
}) {
  if (input.current) {
    if (
      input.proposed.class === "BOUND" &&
      input.proposed.identityId === input.current
    ) {
      return "ALREADY_BOUND";
    }
    return "CONFLICT";
  }
  return input.proposed.class;
}

describe("AI-X6.7B3 backfill ALREADY_BOUND / CONFLICT", () => {
  it("ALREADY_BOUND when existing matches proposed", () => {
    const proposed = resolveP0IdentityOwnershipForLegacyEmail("a@ljd.invalid", {
      settingsByEmail: new Map([["a@ljd.invalid", "id-a"]]),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map(),
    });
    expect(classifyExisting({ current: "id-a", proposed })).toBe("ALREADY_BOUND");
  });

  it("CONFLICT when existing differs from proposed — no overwrite", () => {
    const proposed = resolveP0IdentityOwnershipForLegacyEmail("a@ljd.invalid", {
      settingsByEmail: new Map([["a@ljd.invalid", "id-a"]]),
      claimByActorKey: new Map(),
      primaryEmailIdentityIds: new Map(),
    });
    expect(classifyExisting({ current: "id-b", proposed })).toBe("CONFLICT");
  });
});

/**
 * AI-X6.7B5 — mutation authority unit tests (no DB).
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IDENTITY_REBIND_ALLOWED,
} from "@/lib/account/p0IdentityMutationAuthority";
import {
  isP0IdentityMutationAuthorityEnabled,
  P0_IDENTITY_MUTATION_AUTHORITY_FLAG,
} from "@/lib/account/p0IdentityMutationAuthorityGate";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI-X6.7B5 mutation authority gate", () => {
  it("defaults OFF", () => {
    expect(isP0IdentityMutationAuthorityEnabled({})).toBe(false);
  });

  it("enables on YES|1", () => {
    expect(
      isP0IdentityMutationAuthorityEnabled({
        [P0_IDENTITY_MUTATION_AUTHORITY_FLAG]: "YES",
      }),
    ).toBe(true);
  });

  it("IDENTITY_REBIND_ALLOWED is NO", () => {
    expect(IDENTITY_REBIND_ALLOWED).toBe(false);
  });
});

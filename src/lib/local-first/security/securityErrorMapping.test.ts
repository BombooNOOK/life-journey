import { describe, expect, it } from "vitest";

import { mapSecurityError } from "@/lib/local-first/security/securityErrorMapping";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

describe("security error mapping", () => {
  it("maps native-only and unimplemented messages", () => {
    expect(mapSecurityError(new Error("native-only helper")).code).toBe(
      "native_only",
    );
    expect(
      mapSecurityError(new Error("Not implemented on web.")).code,
    ).toBe("bridge_unimplemented");
  });

  it("preserves LocalFirstSecurityError", () => {
    const err = new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "nope",
    );
    expect(mapSecurityError(err)).toBe(err);
  });
});

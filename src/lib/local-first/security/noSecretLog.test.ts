import { describe, expect, it } from "vitest";

import {
  assertNoSecretInText,
  redactSecretLike,
  safeErrorMessage,
} from "@/lib/local-first/security/noSecretLog";

describe("no-secret logging", () => {
  it("redacts secret-named fields", () => {
    const out = redactSecretLike({
      passphrase: "super-secret-value-123456",
      path: "/tmp/db",
    }) as Record<string, unknown>;
    expect(out.passphrase).toBe("[redacted]");
    expect(out.path).toBe("/tmp/db");
  });

  it("does not leak passphrase in safeErrorMessage", () => {
    const msg = safeErrorMessage(
      new Error("setEncryptionSecret failed passphrase: abcdefghijklmnop"),
    );
    expect(msg.toLowerCase()).not.toContain("abcdefghijklmnop");
  });

  it("throws when asked to log an obvious secret payload", () => {
    expect(() =>
      assertNoSecretInText("secret: abcdefghijklmnop"),
    ).toThrow(/refusing to log/);
  });
});

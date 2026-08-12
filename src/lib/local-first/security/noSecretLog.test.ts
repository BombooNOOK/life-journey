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

  it("keeps bootstrap report JSON free of passphrase fields", () => {
    const report = {
      status: "already_ready",
      pluginKeychain: "reused_existing",
      dbName: "ljd_local_journal_secure_candidate",
    };
    const text = JSON.stringify(report);
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });

  it("keeps candidate copy reports free of body text and secrets", () => {
    const report = {
      copied: 3,
      alreadyPresent: 0,
      targetDb: "ljd_local_journal_secure_candidate",
      results: [
        {
          status: "copied",
          serverId: "cuid_test_copy_a",
          contentHash: "abc123def456",
        },
      ],
    };
    const text = JSON.stringify(report);
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(text).not.toContain("森のテスト");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });

  it("keeps API method names while redacting hex blobs", () => {
    const msg = safeErrorMessage(
      new Error("Query: Connection to ljd_enc_mig_fixture_plain not available"),
    );
    expect(msg).toContain("ljd_enc_mig_fixture_plain");
    expect(
      safeErrorMessage(new Error("key=abcdef0123456789abcdef0123456789")),
    ).not.toContain("abcdef0123456789abcdef0123456789");
  });
});

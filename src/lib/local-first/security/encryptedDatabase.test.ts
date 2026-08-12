import { describe, expect, it } from "vitest";

import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import {
  openNamedEncryptedDatabase,
  shouldSetPluginEncryptionSecret,
} from "@/lib/local-first/security/encryptedDatabase";
import { LJD_SQLITE_ENCRYPTION_MODE } from "@/lib/local-first/security/types";

describe("encrypted configuration (no native open)", () => {
  it("uses plugin secret mode, not a custom keystore name", () => {
    expect(LJD_SQLITE_ENCRYPTION_MODE).toBe("secret");
  });

  it("does not set a second plugin secret when one is already stored", () => {
    expect(shouldSetPluginEncryptionSecret(true)).toBe(false);
    expect(shouldSetPluginEncryptionSecret(false)).toBe(true);
  });

  it("refuses to encrypt the production journal name", async () => {
    await expect(openNamedEncryptedDatabase(LOCAL_JOURNAL_DB_NAME)).rejects.toMatchObject(
      { code: "journal_encryption_forbidden" },
    );
  });
});

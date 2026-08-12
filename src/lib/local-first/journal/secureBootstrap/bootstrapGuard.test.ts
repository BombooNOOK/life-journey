import { describe, expect, it } from "vitest";

import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { decideCapacityKnown } from "@/lib/local-first/security/storageCapacity";
import { openNamedEncryptedDatabase } from "@/lib/local-first/security/encryptedDatabase";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

describe("secure bootstrap guards", () => {
  it("refuses to open the production journal encrypted", async () => {
    await expect(openNamedEncryptedDatabase(LOCAL_JOURNAL_DB_NAME)).rejects.toMatchObject({
      code: "journal_encryption_forbidden",
    });
  });

  it("keeps the candidate name off the active repository name", () => {
    expect(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME).toBe(
      "ljd_local_journal_secure_candidate",
    );
  });

  it("fail-closes bootstrap when capacity is unknown", () => {
    expect(decideCapacityKnown(null).reason).toBe("capacity_unknown_fail_closed");
  });

  it("allows a known positive capacity reading", () => {
    expect(decideCapacityKnown(6_780_035_072).known).toBe(true);
  });

  it("documents production-name protection as a LocalFirstSecurityError", () => {
    const err = new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "secure bootstrap refuses ljd_local_journal",
    );
    expect(err.code).toBe("journal_encryption_forbidden");
  });
});

import { describe, expect, it } from "vitest";

import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

describe("migrator production-journal guard", () => {
  it("documents that ljd_local_journal must stay plaintext this phase", () => {
    const err = new LocalFirstSecurityError(
      "journal_encryption_forbidden",
      "4B-3F refuses to migrate ljd_local_journal; fixture DBs only",
    );
    expect(err.code).toBe("journal_encryption_forbidden");
    expect(LOCAL_JOURNAL_DB_NAME).toBe("ljd_local_journal");
  });
});

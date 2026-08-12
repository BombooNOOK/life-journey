import { describe, expect, it } from "vitest";

import { classifySqliteArtifactRole } from "@/lib/local-first/security/storageInspection";

describe("read-only sqlite artifact inspection", () => {
  it("classifies db and sidecars without reading content", () => {
    expect(classifySqliteArtifactRole("ljd_local_journalSQLite.db")).toBe("sqlite_db");
    expect(classifySqliteArtifactRole("exampleSQLite.db-wal")).toBe("sidecar_wal");
    expect(classifySqliteArtifactRole("exampleSQLite.db-shm")).toBe("sidecar_shm");
    expect(classifySqliteArtifactRole("exampleSQLite.db-journal")).toBe("sidecar_journal");
  });
});

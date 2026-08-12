import { describe, expect, it } from "vitest";

import { classifyCandidateHealth } from "@/lib/local-first/journal/secureBootstrap/candidateHealth";
import { LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME } from "@/lib/local-first/journal/secureBootstrap/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

const readyTables = [
  "local_journal_entries",
  "local_journal_tags",
  "local_media",
];

describe("secure candidate health", () => {
  it("treats a missing file as bootstrapable", () => {
    expect(
      classifyCandidateHealth({
        exists: false,
        encrypted: null,
        userVersion: null,
        tables: [],
      }).status,
    ).toBe("missing");
  });

  it("rejects a plaintext candidate without deleting it", () => {
    const health = classifyCandidateHealth({
      exists: true,
      encrypted: false,
      userVersion: 1,
      tables: readyTables,
    });
    expect(health).toEqual({ status: "abnormal", reason: "plaintext_candidate" });
  });

  it("fail-closes when encryption cannot be determined", () => {
    expect(
      classifyCandidateHealth({
        exists: true,
        encrypted: null,
        userVersion: 1,
        tables: readyTables,
      }).reason,
    ).toBe("encryption_unknown");
  });

  it("rejects schema version and missing tables", () => {
    expect(
      classifyCandidateHealth({
        exists: true,
        encrypted: true,
        userVersion: 2,
        tables: readyTables,
      }).reason,
    ).toBe("user_version_mismatch");
    expect(
      classifyCandidateHealth({
        exists: true,
        encrypted: true,
        userVersion: 1,
        tables: ["local_journal_entries"],
      }).reason,
    ).toBe("missing_tables:local_journal_tags,local_media");
  });

  it("accepts the official schema inventory", () => {
    const health = classifyCandidateHealth({
      exists: true,
      encrypted: true,
      userVersion: 1,
      tables: readyTables,
      columns: {
        local_journal_entries: [
          "stable_id",
          "date_key",
          "title",
          "content",
          "created_at",
          "updated_at",
          "tags_json",
          "schema_version",
          "source",
          "local_status",
          "imported_at",
          "legacy_server_id",
          "server_updated_at",
        ],
        local_journal_tags: ["journal_stable_id", "tag"],
        local_media: [
          "stable_id",
          "journal_stable_id",
          "type",
          "relative_path",
          "created_at",
          "checksum",
          "mime_type",
        ],
      },
    });
    expect(health.status).toBe("ready");
  });

  it("never uses the production journal name as the candidate", () => {
    expect(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME).not.toBe(LOCAL_JOURNAL_DB_NAME);
    expect(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME).toContain("candidate");
  });
});

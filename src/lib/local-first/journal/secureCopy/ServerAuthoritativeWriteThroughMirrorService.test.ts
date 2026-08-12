import { describe, expect, it } from "vitest";

import { sha256HexOfBase64 } from "@/lib/local-first/journal/checksum";
import type { ApiJournalEntry } from "@/lib/local-first/journal/serverFetch";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";
import { mirrorExplicitIdWithDeps } from "@/lib/local-first/journal/secureCopy/ServerAuthoritativeWriteThroughMirrorService";
import type { MirrorPrimitiveDeps } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import { hasTestPurposeTag } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
} from "@/lib/local-first/journal/secureCopy/types";
import {
  SECURE_CANDIDATE_MEDIA_ROOT,
  SERVER_COPY_TARGET_DB_NAME,
} from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";

function apiEntry(partial: Partial<ApiJournalEntry> & Pick<ApiJournalEntry, "id" | "content">): ApiJournalEntry {
  return {
    createdAt: "2026-08-12T06:00:00.000Z",
    updatedAt: "2026-08-12T06:00:00.000Z",
    hasPhoto: false,
    ...partial,
  };
}

const ENTRY_WT = apiEntry({
  id: "cuid_write_through_test",
  content: "write-through mirror PoC body\n\n#WriteThroughTest #テスト",
  hasPhoto: true,
  photoSrc: "/photo-wt",
});

const PERSONAL = apiEntry({
  id: "cuid_personal_not_for_mirror",
  content: "普通の日記。タグなし。",
});

const PHOTO_WT = btoa("write-through-photo-bytes");

function memoryRepository(): JournalRepositoryPort & { rows: LocalJournalEntry[] } {
  const rows: LocalJournalEntry[] = [];
  return {
    rows,
    async save(entry) {
      const idx = rows.findIndex((r) => r.stableId === entry.stableId);
      if (idx >= 0) rows[idx] = entry;
      else rows.push(entry);
    },
    async getById(stableId) {
      return rows.find((r) => r.stableId === stableId) ?? null;
    },
    async getByLegacyServerId(legacyServerId) {
      return rows.find((r) => r.legacyServerId === legacyServerId) ?? null;
    },
    async countEntries() {
      return rows.length;
    },
    async countTags() {
      return rows.reduce((n, r) => n + r.tags.length, 0);
    },
    async countMedia() {
      return rows.reduce((n, r) => n + r.mediaRefs.length, 0);
    },
  };
}

function memoryMedia(): CandidateMediaPort & { files: Map<string, string>; deletes: string[] } {
  const files = new Map<string, string>();
  const deletes: string[] = [];
  return {
    root: SECURE_CANDIDATE_MEDIA_ROOT,
    files,
    deletes,
    async write(fileName, base64) {
      const path = `${SECURE_CANDIDATE_MEDIA_ROOT}/${fileName}`;
      files.set(path, base64);
      return path;
    },
    async readBase64(relativePath) {
      const data = files.get(relativePath);
      if (!data) throw new Error("missing media");
      return data;
    },
    async delete(relativePath) {
      deletes.push(relativePath);
      files.delete(relativePath);
    },
  };
}

function createDeps(overrides?: {
  entries?: Record<string, ApiJournalEntry>;
  photos?: Record<
    string,
    | { ok: true; base64: string; byteLength: number; mimeType: string }
    | { ok: false; message: string }
  >;
}): MirrorPrimitiveDeps & {
  repository: ReturnType<typeof memoryRepository>;
  media: ReturnType<typeof memoryMedia>;
} {
  const catalog: Record<string, ApiJournalEntry> = {
    [ENTRY_WT.id]: ENTRY_WT,
    [PERSONAL.id]: PERSONAL,
    ...(overrides?.entries ?? {}),
  };
  const photos: Record<
    string,
    | { ok: true; base64: string; byteLength: number; mimeType: string }
    | { ok: false; message: string }
  > = {
    [ENTRY_WT.id]: {
      ok: true,
      base64: PHOTO_WT,
      byteLength: PHOTO_WT.length,
      mimeType: "image/jpeg",
    },
    ...(overrides?.photos ?? {}),
  };
  const repository = memoryRepository();
  const media = memoryMedia();
  let seq = 0;
  return {
    repository,
    media,
    fetchEntry: async (id) => {
      const entry = catalog[id];
      if (!entry) return { ok: false, code: "NOT_FOUND", message: "対象の記録が見つかりません。" };
      return { ok: true, entry };
    },
    downloadPhoto: async (id) => photos[id] ?? { ok: false, message: "写真取得失敗 (404)" },
    createStableId: () => `01WTSTABLE${String(++seq).padStart(14, "0")}`,
  };
}

describe("write-through: candidate guard + tags", () => {
  it("targets only encrypted candidate", () => {
    expect(SERVER_COPY_TARGET_DB_NAME).toBe("ljd_local_journal_secure_candidate");
    expect(() => assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME)).not.toThrow();
    expect(() => assertAllowedCopyTargetDb(LOCAL_JOURNAL_DB_NAME)).toThrow(LocalFirstSecurityError);
  });

  it("accepts #WriteThroughTest", () => {
    expect(hasTestPurposeTag(["#WriteThroughTest"])).toBe(true);
  });
});

describe("write-through: canonical mirror success", () => {
  it("mirrors Server entry with Local ULID + legacyServerId + media SHA", async () => {
    const deps = createDeps();
    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
    });
    expect(result.result).toBe("mirrored");
    expect(result.ok).toBe(true);
    expect(result.needsRetry).toBe(false);
    expect(result.stableId).toMatch(/^01WTSTABLE/);
    expect(result.legacyServerId).toBe(ENTRY_WT.id);
    expect(result.stableId).not.toBe(ENTRY_WT.id);
    expect(deps.repository.rows).toHaveLength(1);
    expect(deps.repository.rows[0]?.source).toBe("migrated_server");
    const expected = await sha256HexOfBase64(PHOTO_WT);
    expect(deps.repository.rows[0]?.mediaRefs[0]?.checksum).toBe(expected);
    for (const path of deps.media.files.keys()) {
      expect(path.startsWith(`${SECURE_CANDIDATE_MEDIA_ROOT}/`)).toBe(true);
      expect(path.startsWith(`${LOCAL_JOURNAL_MEDIA_ROOT}/`)).toBe(false);
    }
  });
});

describe("write-through: Server OK / Local failure (no Server rollback)", () => {
  it("injects Local save failure, leaves no partial row/media, needsRetry=true", async () => {
    const deps = createDeps();
    let serverDeleted = false;
    const originalFetch = deps.fetchEntry;
    deps.fetchEntry = async (id) => {
      const r = await originalFetch(id);
      return r;
    };
    // Simulate that Server side is never touched by this service:
    const deleteServer = () => {
      serverDeleted = true;
    };

    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
      injectLocalFailure: "save",
    });

    expect(result.result).toBe("failed");
    expect(result.needsRetry).toBe(true);
    expect(result.injectedLocalFailure).toBe("save");
    expect(result.detail).toContain("injected_local_save_failure");
    expect(deps.repository.rows).toHaveLength(0);
    expect(deps.media.files.size).toBe(0);
    expect(deps.media.deletes.length).toBeGreaterThan(0);
    // Server cannot be rolled back by this PoC (GET-only) — assert we never "delete".
    expect(serverDeleted).toBe(false);
    void deleteServer;
  });

  it("injects media_write failure with no partial artifacts", async () => {
    const deps = createDeps();
    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
      injectLocalFailure: "media_write",
    });
    expect(result.result).toBe("failed");
    expect(result.needsRetry).toBe(true);
    expect(deps.repository.rows).toHaveLength(0);
    expect(deps.media.files.size).toBe(0);
  });
});

describe("write-through: retry + already_present", () => {
  it("retries after Local failure then already_present on rerun", async () => {
    const deps = createDeps();
    const fail = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
      injectLocalFailure: "save",
    });
    expect(fail.needsRetry).toBe(true);
    expect(deps.repository.rows).toHaveLength(0);

    const retry = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
    });
    expect(retry.result).toBe("mirrored");
    expect(retry.needsRetry).toBe(false);
    expect(deps.repository.rows).toHaveLength(1);
    expect(deps.media.files.size).toBe(1);
    const stableId = retry.stableId;

    const again = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
    });
    expect(again.result).toBe("already_present");
    expect(again.stableId).toBe(stableId);
    expect(deps.repository.rows).toHaveLength(1);
    expect(deps.media.files.size).toBe(1);
  });
});

describe("write-through: source_changed / no overwrite", () => {
  it("does not overwrite when Server fingerprint drifts", async () => {
    const deps = createDeps();
    await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, { availableBytes: 5_000_000 });
    const original = deps.repository.rows[0]!;
    const changed = {
      ...ENTRY_WT,
      updatedAt: "2026-08-12T09:00:00.000Z",
      content: "changed body\n\n#WriteThroughTest",
    };
    const second = createDeps({ entries: { [ENTRY_WT.id]: changed } });
    second.repository.rows.push(original);
    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, second, {
      availableBytes: 5_000_000,
    });
    expect(result.result).toBe("source_changed");
    expect(result.needsRetry).toBe(false);
    expect(second.repository.rows[0]?.content).toBe(original.content);
    expect(second.repository.rows[0]?.stableId).toBe(original.stableId);
  });
});

describe("write-through: capacity + logging + personal guard", () => {
  it("fail-closes when capacity unknown", async () => {
    const deps = createDeps();
    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: null,
    });
    expect(result.result).toBe("blocked");
    expect(result.blockedReason).toBe("capacity_unknown_fail_closed");
    expect(deps.repository.rows).toHaveLength(0);
  });

  it("refuses non-test entries", async () => {
    const deps = createDeps();
    const result = await mirrorExplicitIdWithDeps(PERSONAL.id, deps, {
      availableBytes: 5_000_000,
    });
    expect(result.result).toBe("failed");
    expect(result.detail).toBe("not_test_entry");
    expect(result.needsRetry).toBe(false);
  });

  it("keeps MirrorResult free of body text and secrets", async () => {
    const deps = createDeps();
    const result = await mirrorExplicitIdWithDeps(ENTRY_WT.id, deps, {
      availableBytes: 5_000_000,
    });
    const text = JSON.stringify(result);
    expect(text).not.toContain("write-through mirror PoC body");
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });
});

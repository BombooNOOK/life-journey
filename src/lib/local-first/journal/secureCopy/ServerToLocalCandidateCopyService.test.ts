import { describe, expect, it } from "vitest";

import { sha256HexOfBase64, sha256HexOfUtf8 } from "@/lib/local-first/journal/checksum";
import type { ApiJournalEntry } from "@/lib/local-first/journal/serverFetch";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";
import {
  copyExplicitIdsWithDeps,
  type CopyServiceDeps,
} from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import { sourceFingerprintChanged } from "@/lib/local-first/journal/secureCopy/sourceFingerprint";
import { hasTestPurposeTag, parseExplicitEntryIds } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
} from "@/lib/local-first/journal/secureCopy/types";
import {
  FAILURE_INJECTION_MISSING_ENTRY_ID,
  SECURE_CANDIDATE_MEDIA_ROOT,
  SERVER_COPY_TARGET_DB_NAME,
} from "@/lib/local-first/journal/secureCopy/types";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";

function apiEntry(partial: Partial<ApiJournalEntry> & Pick<ApiJournalEntry, "id" | "content">): ApiJournalEntry {
  return {
    createdAt: "2026-08-12T00:00:00.000Z",
    updatedAt: "2026-08-12T00:00:00.000Z",
    hasPhoto: false,
    ...partial,
  };
}

const ENTRY_A = apiEntry({
  id: "cuid_test_copy_a",
  content: "森のテスト本文A\n\n#テスト #LocalCopyTest #雨",
  hasPhoto: true,
  photoSrc: "/photo-a",
});
const ENTRY_B = apiEntry({
  id: "cuid_test_copy_b",
  content: "本文のみのテストB\n\n#テスト",
});
const ENTRY_C = apiEntry({
  id: "cuid_test_copy_c",
  content: "日本語のテスト本文Cです。\n\n#お引越しテスト #森",
  hasPhoto: true,
  photoSrc: "/photo-c",
});
const PERSONAL = apiEntry({
  id: "cuid_personal_not_for_copy",
  content: "普通の日記。タグなし。",
});

const PHOTO_A = btoa("photo-a-bytes");
const PHOTO_C = btoa("photo-c-bytes");

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
  photos?: Record<string, { ok: true; base64: string; byteLength: number; mimeType: string } | { ok: false; message: string }>;
  saveError?: Error;
  corruptRead?: boolean;
}): CopyServiceDeps & {
  repository: ReturnType<typeof memoryRepository>;
  media: ReturnType<typeof memoryMedia>;
} {
  const catalog: Record<string, ApiJournalEntry> = {
    [ENTRY_A.id]: ENTRY_A,
    [ENTRY_B.id]: ENTRY_B,
    [ENTRY_C.id]: ENTRY_C,
    [PERSONAL.id]: PERSONAL,
    ...(overrides?.entries ?? {}),
  };
  const photos: Record<string, { ok: true; base64: string; byteLength: number; mimeType: string } | { ok: false; message: string }> = {
    [ENTRY_A.id]: { ok: true, base64: PHOTO_A, byteLength: PHOTO_A.length, mimeType: "image/jpeg" },
    [ENTRY_C.id]: { ok: true, base64: PHOTO_C, byteLength: PHOTO_C.length, mimeType: "image/jpeg" },
    ...(overrides?.photos ?? {}),
  };
  const repository = memoryRepository();
  const media = memoryMedia();
  let seq = 0;
  if (overrides?.saveError) {
    const err = overrides.saveError;
    repository.save = async () => {
      throw err;
    };
  }
  if (overrides?.corruptRead) {
    media.readBase64 = async () => btoa("corrupted");
  }
  return {
    repository,
    media,
    fetchEntry: async (id) => {
      const entry = catalog[id];
      if (!entry) return { ok: false, code: "NOT_FOUND", message: "対象の記録が見つかりません。" };
      return { ok: true, entry };
    },
    downloadPhoto: async (id) => {
      return photos[id] ?? { ok: false, message: "写真取得失敗 (404)" };
    },
    createStableId: () => `01TESTSTABLE${String(++seq).padStart(12, "0")}`,
  };
}

describe("explicit ID allowlist", () => {
  it("parses explicit IDs only and does not invent extras", () => {
    expect(parseExplicitEntryIds("a\nb, a ;c")).toEqual(["a", "b", "c"]);
    expect(parseExplicitEntryIds("")).toEqual([]);
  });

  it("blocks an empty ID list", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps([], deps, { availableBytes: 5_000_000 });
    expect(result.blockedReason).toBe("explicit_ids_required");
    expect(result.copied).toBe(0);
  });

  it("refuses non-test entries even if IDs are explicit", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps([PERSONAL.id], deps, {
      availableBytes: 5_000_000,
    });
    expect(result.failed).toBe(1);
    expect(result.results[0]?.detail).toBe("not_test_entry");
    expect(deps.repository.rows).toHaveLength(0);
  });
});

describe("candidate DB guard", () => {
  it("allows only the encrypted candidate name", () => {
    expect(SERVER_COPY_TARGET_DB_NAME).toBe("ljd_local_journal_secure_candidate");
    expect(() => assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME)).not.toThrow();
  });

  it("protects the actual production DB name", () => {
    expect(() => assertAllowedCopyTargetDb(LOCAL_JOURNAL_DB_NAME)).toThrow(
      LocalFirstSecurityError,
    );
    expect(() => assertAllowedCopyTargetDb("ljd_enc_mig_fixture_plain")).toThrow(
      LocalFirstSecurityError,
    );
  });
});

describe("multi-entry copy", () => {
  it("copies three explicit test entries", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps(
      [ENTRY_A.id, ENTRY_B.id, ENTRY_C.id],
      deps,
      { availableBytes: 5_000_000 },
    );
    expect(result.copied).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.rowCounts?.entries).toBe(3);
    expect(result.rowCounts?.media).toBe(2);
    expect(new Set(deps.repository.rows.map((r) => r.stableId)).size).toBe(3);
    expect(deps.repository.rows.every((r) => r.source === "migrated_server")).toBe(true);
    expect(
      deps.repository.rows.every((r) => r.legacyServerId && r.legacyServerId !== r.stableId),
    ).toBe(true);
    for (const media of deps.media.files.keys()) {
      expect(media.startsWith(`${SECURE_CANDIDATE_MEDIA_ROOT}/`)).toBe(true);
      expect(media.startsWith(`${LOCAL_JOURNAL_MEDIA_ROOT}/`)).toBe(false);
    }
  });
});

describe("legacyServerId dedupe / already_present / stableId persistence", () => {
  it("reruns as already_present without new ULIDs or extra media", async () => {
    const deps = createDeps();
    const ids = [ENTRY_A.id, ENTRY_B.id, ENTRY_C.id];
    const first = await copyExplicitIdsWithDeps(ids, deps, { availableBytes: 5_000_000 });
    const stableIds = first.results.map((r) => r.stableId);
    const second = await copyExplicitIdsWithDeps(ids, deps, { availableBytes: 5_000_000 });
    expect(second.copied).toBe(0);
    expect(second.alreadyPresent).toBe(3);
    expect(second.results.map((r) => r.stableId)).toEqual(stableIds);
    expect(deps.repository.rows).toHaveLength(3);
    expect(deps.media.files.size).toBe(2);
  });
});

describe("source_changed / no auto overwrite", () => {
  it("detects changed serverUpdatedAt + content hash and does not overwrite", async () => {
    const deps = createDeps();
    await copyExplicitIdsWithDeps([ENTRY_B.id], deps, { availableBytes: 5_000_000 });
    const original = deps.repository.rows[0]!;
    const changed: ApiJournalEntry = {
      ...ENTRY_B,
      updatedAt: "2026-08-12T03:00:00.000Z",
      content: "本文が変わったテストB\n\n#テスト",
    };
    const secondDeps = createDeps({ entries: { [ENTRY_B.id]: changed } });
    secondDeps.repository.rows.push(original);
    const result = await copyExplicitIdsWithDeps([ENTRY_B.id], secondDeps, {
      availableBytes: 5_000_000,
    });
    expect(result.sourceChanged).toBe(1);
    expect(result.copied).toBe(0);
    expect(secondDeps.repository.rows[0]?.content).toBe(original.content);
    expect(secondDeps.repository.rows[0]?.stableId).toBe(original.stableId);
  });

  it("fingerprint helper flags hash drift", async () => {
    const a = {
      legacyServerId: "x",
      serverUpdatedAt: "t1",
      contentHash: await sha256HexOfUtf8("one"),
      tags: ["#テスト"],
      photoHash: null,
      mediaCount: 0,
    };
    const b = { ...a, contentHash: await sha256HexOfUtf8("two"), serverUpdatedAt: "t2" };
    expect(sourceFingerprintChanged(a, b)).toBe(true);
    expect(sourceFingerprintChanged(a, a)).toBe(false);
  });
});

describe("photo checksum / media and DB rollback", () => {
  it("stores SHA-256 on copied media", async () => {
    const deps = createDeps();
    await copyExplicitIdsWithDeps([ENTRY_A.id], deps, { availableBytes: 5_000_000 });
    const expected = await sha256HexOfBase64(PHOTO_A);
    expect(deps.repository.rows[0]?.mediaRefs[0]?.checksum).toBe(expected);
  });

  it("rolls back media when checksum verify fails", async () => {
    const deps = createDeps({ corruptRead: true });
    const result = await copyExplicitIdsWithDeps([ENTRY_A.id], deps, {
      availableBytes: 5_000_000,
    });
    expect(result.failed).toBe(1);
    expect(result.results[0]?.detail).toBe("photo_checksum_mismatch");
    expect(deps.repository.rows).toHaveLength(0);
  });

  it("rolls back media when DB save fails", async () => {
    const deps = createDeps({ saveError: new Error("sqlite boom") });
    const result = await copyExplicitIdsWithDeps([ENTRY_A.id], deps, {
      availableBytes: 5_000_000,
    });
    expect(result.failed).toBe(1);
    expect(deps.media.deletes.length).toBeGreaterThan(0);
  });
});

describe("one failure + others survive", () => {
  it("continues after a missing entry ID", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps(
      [ENTRY_A.id, FAILURE_INJECTION_MISSING_ENTRY_ID, ENTRY_B.id],
      deps,
      { availableBytes: 5_000_000 },
    );
    expect(result.copied).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results.find((r) => r.serverId === FAILURE_INJECTION_MISSING_ENTRY_ID)?.status).toBe(
      "failed",
    );
    expect(deps.repository.rows).toHaveLength(2);
  });
});

describe("capacity unknown fail-closed", () => {
  it("does not start copy when capacity is unknown", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps([ENTRY_A.id], deps, {
      availableBytes: null,
    });
    expect(result.blockedReason).toBe("capacity_unknown_fail_closed");
    expect(deps.repository.rows).toHaveLength(0);
  });
});

describe("no-secret / no-content logging + test tag + media namespace", () => {
  it("keeps copy reports free of body text and secrets", async () => {
    const deps = createDeps();
    const result = await copyExplicitIdsWithDeps([ENTRY_A.id], deps, {
      availableBytes: 5_000_000,
    });
    const text = JSON.stringify(result);
    expect(text).not.toContain("森のテスト本文A");
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });

  it("recognizes test-purpose tags only", () => {
    expect(hasTestPurposeTag(["#テスト"])).toBe(true);
    expect(hasTestPurposeTag(["#LocalCopyTest"])).toBe(true);
    expect(hasTestPurposeTag(["#雨"])).toBe(false);
  });
});

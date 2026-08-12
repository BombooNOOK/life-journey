import { describe, expect, it } from "vitest";

import {
  attachManifestChecksum,
  canonicalJsonString,
  computeManifestChecksum,
  verifyManifestChecksum,
} from "@/lib/local-first/journal/activation/manifestCanonical";
import {
  LocalJournalActivationManifestStore,
  createMemoryManifestFs,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import {
  activateTechnicalCandidateWithFs,
  demonstrateManifestRollbackSemantics,
  resolveTechnicalActiveLocalJournalWithFs,
} from "@/lib/local-first/journal/activation/LocalJournalTechnicalActivation";
import {
  ACTIVATION_MANIFEST_FORMAT_VERSION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  assertAllowedTechnicalDatabaseId,
  isAllowedTechnicalDatabaseId,
  type ManifestChecksumBody,
} from "@/lib/local-first/journal/activation/types";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";

const PATH = "/tmp/ljd-as/ljd-local-journal-activation.json";

function body(partial?: Partial<ManifestChecksumBody>): ManifestChecksumBody {
  return {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: 2,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: null,
    previousMediaRootId: null,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: "2026-08-12T07:00:00.000Z",
    ...partial,
  };
}

describe("manifest canonical serialization + checksum", () => {
  it("sorts keys stably regardless of insertion order", () => {
    const a = canonicalJsonString({ b: 1, a: 2 });
    const b = canonicalJsonString({ a: 2, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"b":1}');
  });

  it("excludes checksum field from digest input", async () => {
    const base = body();
    const withChecksum = await attachManifestChecksum(base);
    const again = await computeManifestChecksum(withChecksum);
    expect(again).toBe(withChecksum.checksum);
    expect(await verifyManifestChecksum(withChecksum)).toBe(true);
  });

  it("detects checksum mismatch", async () => {
    const manifest = await attachManifestChecksum(body());
    const tampered = { ...manifest, checksum: "0".repeat(64) };
    expect(await verifyManifestChecksum(tampered)).toBe(false);
  });
});

describe("atomic write abstraction + first activation", () => {
  it("writes via atomicReplace and reads back", async () => {
    const fs = createMemoryManifestFs();
    const written = await LocalJournalActivationManifestStore.writeBodyWithFs(
      PATH,
      body(),
      fs,
    );
    expect(fs.replaceCalls).toBe(1);
    const read = await LocalJournalActivationManifestStore.readWithFs(PATH, fs);
    expect(read.status).toBe("ok");
    if (read.status === "ok") {
      expect(read.manifest.checksum).toBe(written.checksum);
      expect(read.manifest.activeDatabaseId).toBe(TECHNICAL_ACTIVE_DATABASE_ID);
    }
  });

  it("activates when preflight override passes", async () => {
    const fs = createMemoryManifestFs();
    const result = await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: true, detail: "forced" },
      skipKeychain: true,
      skipMediaFilesystem: true,
    });
    expect(result.code).toBe("activated");
    expect(result.manifest?.activationState).toBe("active");
    expect(result.manifest?.previousDatabaseId).toBeNull();
  });

  it("returns already_active on second activation", async () => {
    const fs = createMemoryManifestFs();
    await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: true, detail: "forced" },
    });
    const second = await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: true, detail: "forced" },
    });
    expect(second.code).toBe("already_active");
  });
});

describe("corrupt / missing / unknown format fail-closed", () => {
  it("corrupt JSON does not open candidate ids", async () => {
    const fs = createMemoryManifestFs();
    await fs.atomicReplaceText(PATH, "{not-json");
    const resolve = await resolveTechnicalActiveLocalJournalWithFs({
      fs,
      absolutePath: PATH,
    });
    expect(resolve.status).toBe("corrupt_manifest");
    expect(resolve.technicalDatabaseId).toBeNull();
  });

  it("checksum mismatch fail-closed", async () => {
    const fs = createMemoryManifestFs();
    const good = await attachManifestChecksum(body());
    await fs.atomicReplaceText(
      PATH,
      JSON.stringify({ ...good, checksum: "deadbeef" }),
    );
    const resolve = await resolveTechnicalActiveLocalJournalWithFs({
      fs,
      absolutePath: PATH,
    });
    expect(resolve.status).toBe("checksum_mismatch");
    expect(resolve.technicalDatabaseId).toBeNull();
  });

  it("unknown formatVersion fail-closed", async () => {
    const fs = createMemoryManifestFs();
    const weird = await attachManifestChecksum(body({ formatVersion: 99 as never }));
    await fs.atomicReplaceText(PATH, JSON.stringify(weird));
    const read = await LocalJournalActivationManifestStore.readWithFs(PATH, fs);
    expect(read.status).toBe("unknown_format");
  });

  it("missing activeDatabaseId invalid_shape", async () => {
    const fs = createMemoryManifestFs();
    await fs.atomicReplaceText(
      PATH,
      JSON.stringify({
        formatVersion: 1,
        generation: 2,
        checksum: "x",
      }),
    );
    const read = await LocalJournalActivationManifestStore.readWithFs(PATH, fs);
    expect(read.status).toBe("invalid_shape");
  });

  it("missing DB target fail-closed without discovery", async () => {
    const fs = createMemoryManifestFs();
    await LocalJournalActivationManifestStore.writeBodyWithFs(PATH, body(), fs);
    const resolve = await resolveTechnicalActiveLocalJournalWithFs({
      fs,
      absolutePath: PATH,
      verifyDatabaseExists: async () => false,
    });
    expect(resolve.status).toBe("missing_database");
    expect(resolve.technicalDatabaseId).toBeNull();
  });
});

describe("preflight failure + rollback-preserved + guards", () => {
  it("preflight failure without prior manifest does not write", async () => {
    const fs = createMemoryManifestFs();
    const result = await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: false, detail: "forced_fail" },
    });
    expect(result.code).toBe("preflight_failed");
    const read = await LocalJournalActivationManifestStore.readWithFs(PATH, fs);
    expect(read.status).toBe("missing");
  });

  it("manifest rollback semantics preserve generation A", async () => {
    const fs = createMemoryManifestFs();
    const demo = await demonstrateManifestRollbackSemantics({
      fs,
      absolutePath: PATH,
    });
    expect(demo.code).toBe("rollback_preserved");
    expect(demo.preservedGeneration).toBe(2);
  });

  it("rejects production plaintext DB as technical target", () => {
    expect(isAllowedTechnicalDatabaseId(LOCAL_JOURNAL_DB_NAME)).toBe(false);
    expect(() => assertAllowedTechnicalDatabaseId(LOCAL_JOURNAL_DB_NAME)).toThrow();
    expect(isAllowedTechnicalDatabaseId(TECHNICAL_ACTIVE_DATABASE_ID)).toBe(true);
  });

  it("capacity unknown can be forced as preflight failure via activate path", async () => {
    const fs = createMemoryManifestFs();
    // Without override, native inspect would run — use override to model capacity gate result.
    const result = await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      availableBytes: null,
      preflightOverride: { ok: false, detail: "capacity_unknown_fail_closed" },
    });
    expect(result.code).toBe("preflight_failed");
    expect(result.detail).toContain("capacity_unknown");
  });

  it("keeps activation results free of secrets/content", async () => {
    const fs = createMemoryManifestFs();
    const result = await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: true, detail: "forced" },
    });
    const text = JSON.stringify(result);
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(text).not.toContain("lj_user_email=");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });

  it("kill/relaunch read: same fs snapshot resolves ready", async () => {
    const fs = createMemoryManifestFs();
    await activateTechnicalCandidateWithFs({
      fs,
      absolutePath: PATH,
      preflightOverride: { ok: true, detail: "forced" },
    });
    // Simulate process restart: new store read over same durable map
    const resolve = await resolveTechnicalActiveLocalJournalWithFs({
      fs,
      absolutePath: PATH,
      verifyDatabaseExists: async () => true,
    });
    expect(resolve.status).toBe("ready");
    expect(resolve.technicalDatabaseId).toBe(TECHNICAL_ACTIVE_DATABASE_ID);
    expect(resolve.technicalMediaRootId).toBe(TECHNICAL_ACTIVE_MEDIA_ROOT_ID);
  });
});

/**
 * 4B-4V / 4B-4V.1a controlled migration + preflight safety — no Neon.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  CONTROLLED_MIGRATE_ALLOW_FLAG,
  CONTROLLED_MIGRATE_ALLOW_VALUE,
  CONTROLLED_MIGRATE_BACKUP_ENV,
  CONTROLLED_MIGRATE_BACKUP_VALUE,
  CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV,
  CONTROLLED_MIGRATE_FINGERPRINT_ENV,
  CONTROLLED_MIGRATE_MODE_ENV,
  JOURNAL_SAVE_OPERATION_MIGRATION,
  PRE_SNAPSHOT_AT_ENV,
  PRE_SNAPSHOT_CREATED_ENV,
  PRE_SNAPSHOT_CREATED_VALUE,
  PRE_SNAPSHOT_REQUIRED_ENV,
  PRE_SNAPSHOT_REQUIRED_VALUE,
  PRODUCTION_DATABASE_URL_ENV,
  assertModeDatabaseAllowed,
  assertOperatorGates,
  assertPendingMigrationsAllowed,
  assertPreSnapshotGates,
  fingerprintDatabaseUrl,
  parsePendingMigrationsFromStatus,
  redactSecretsInText,
  resolveDatabaseUrlForMode,
  runControlledMigration,
} from "./controlled-production-migrate.mjs";
import {
  PREFLIGHT_FORBIDDEN_COMMANDS,
  runProductionPreflight,
} from "./production-preflight.mjs";
import { resolveVercelBuildPlan, buildVercelCommandSteps } from "./vercel-build.mjs";

const LOCAL_URL =
  "postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public";
const FAKE_NEON_URL =
  "postgresql://u:super_secret_pw@ep-abc.neon.tech:5432/neondb?sslmode=require";

/** Known operator Snapshot metadata (non-secret) — do not mutate Neon from tests. */
const KNOWN_SNAPSHOT_AT = "2026-08-13T06:43:21Z";

function productionGatesEnv(
  overrides: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  const fp = fingerprintDatabaseUrl(FAKE_NEON_URL);
  return {
    [CONTROLLED_MIGRATE_MODE_ENV]: "production",
    [CONTROLLED_MIGRATE_ALLOW_FLAG]: CONTROLLED_MIGRATE_ALLOW_VALUE,
    [CONTROLLED_MIGRATE_BACKUP_ENV]: CONTROLLED_MIGRATE_BACKUP_VALUE,
    [PRE_SNAPSHOT_REQUIRED_ENV]: PRE_SNAPSHOT_REQUIRED_VALUE,
    [PRE_SNAPSHOT_CREATED_ENV]: PRE_SNAPSHOT_CREATED_VALUE,
    [PRE_SNAPSHOT_AT_ENV]: KNOWN_SNAPSHOT_AT,
    [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: fp.fingerprint!,
    [CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV]: JOURNAL_SAVE_OPERATION_MIGRATION,
    [PRODUCTION_DATABASE_URL_ENV]: FAKE_NEON_URL,
    ...overrides,
  };
}

describe("4B-4V fingerprint + identity", () => {
  it("fingerprints without exposing password", () => {
    const fp = fingerprintDatabaseUrl(LOCAL_URL);
    expect(fp.ok).toBe(true);
    expect(fp.fingerprint).toMatch(/^[a-f0-9]{16}$/);
    expect(fp.label).not.toContain("ljd_local_dev");
    expect(fp.label).not.toContain("postgresql://");
  });

  it("wrong DB reject for local-dry", () => {
    const r = assertModeDatabaseAllowed(
      "postgresql://u:p@ep-x.neon.tech:5432/neondb",
      "local-dry",
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("local_dry_identity_mismatch");
  });

  it("local-dry accepts ljd_dev", () => {
    expect(assertModeDatabaseAllowed(LOCAL_URL, "local-dry").ok).toBe(true);
  });

  it("localhost rejected as production", () => {
    const r = assertModeDatabaseAllowed(LOCAL_URL, "production");
    expect(r.ok).toBe(false);
    expect(r.code).toBe("production_mode_points_at_local");
  });
});

describe("4B-4V.1a Production URL resolution", () => {
  it("Production URL missing → reject (no DATABASE_URL substitute)", () => {
    const r = resolveDatabaseUrlForMode("production", {
      DATABASE_URL: LOCAL_URL,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("production_database_url_missing");
  });

  it("PRODUCTION_DATABASE_URL used for production", () => {
    const r = resolveDatabaseUrlForMode("production", {
      DATABASE_URL: LOCAL_URL,
      [PRODUCTION_DATABASE_URL_ENV]: FAKE_NEON_URL,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe(PRODUCTION_DATABASE_URL_ENV);
      expect(r.databaseUrl).toBe(FAKE_NEON_URL);
    }
  });
});

describe("4B-4V / 4B-4V.1a operator gates", () => {
  it("missing confirmation reject (production)", () => {
    const r = assertOperatorGates(
      { [CONTROLLED_MIGRATE_MODE_ENV]: "production" },
      "production",
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("allow_flag_missing");
  });

  it("backup gate required (V3)", () => {
    const r = assertOperatorGates(
      {
        [CONTROLLED_MIGRATE_MODE_ENV]: "production",
        [CONTROLLED_MIGRATE_ALLOW_FLAG]: CONTROLLED_MIGRATE_ALLOW_VALUE,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: "abc",
      },
      "production",
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("backup_gate_missing");
  });

  it("Snapshot Gate required before production migrate (V3b)", () => {
    const r = assertOperatorGates(
      {
        [CONTROLLED_MIGRATE_MODE_ENV]: "production",
        [CONTROLLED_MIGRATE_ALLOW_FLAG]: CONTROLLED_MIGRATE_ALLOW_VALUE,
        [CONTROLLED_MIGRATE_BACKUP_ENV]: CONTROLLED_MIGRATE_BACKUP_VALUE,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: "abc",
      },
      "production",
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("pre_snapshot_required_flag_missing");
  });

  it("Snapshot created flag missing", () => {
    const r = assertPreSnapshotGates({
      [PRE_SNAPSHOT_REQUIRED_ENV]: PRE_SNAPSHOT_REQUIRED_VALUE,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("pre_snapshot_created_flag_missing");
  });

  it("Snapshot timestamp metadata required", () => {
    const r = assertPreSnapshotGates({
      [PRE_SNAPSHOT_REQUIRED_ENV]: PRE_SNAPSHOT_REQUIRED_VALUE,
      [PRE_SNAPSHOT_CREATED_ENV]: PRE_SNAPSHOT_CREATED_VALUE,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("pre_snapshot_at_missing");
  });

  it("full production gates accept with snapshot metadata", () => {
    const r = assertOperatorGates(productionGatesEnv(), "production");
    expect(r.ok).toBe(true);
    expect(r.snapshotAt).toBe(KNOWN_SNAPSHOT_AT);
  });

  it("local-dry gates accept mode only", () => {
    expect(
      assertOperatorGates(
        { [CONTROLLED_MIGRATE_MODE_ENV]: "local-dry" },
        "local-dry",
      ).ok,
    ).toBe(true);
  });
});

describe("4B-4V pending migration parse + guard", () => {
  it("parses pending names from migrate status text", () => {
    const sample = `
42 migrations found in prisma/migrations

Following migration have not yet been applied:
${JOURNAL_SAVE_OPERATION_MIGRATION}

`;
    expect(parsePendingMigrationsFromStatus(sample)).toEqual([
      JOURNAL_SAVE_OPERATION_MIGRATION,
    ]);
  });

  it("up to date → empty pending", () => {
    expect(
      parsePendingMigrationsFromStatus("Database schema is up to date!\n"),
    ).toEqual([]);
  });

  it("unexpected pending without allowlist → V2 stop", () => {
    const r = assertPendingMigrationsAllowed(
      [JOURNAL_SAVE_OPERATION_MIGRATION, "20990101000000_other"],
      undefined,
    );
    expect(r.ok).toBe(false);
    expect(r.code).toBe("unexpected_pending_migrations");
  });

  it("exact allowlist match", () => {
    const r = assertPendingMigrationsAllowed(
      [JOURNAL_SAVE_OPERATION_MIGRATION],
      JOURNAL_SAVE_OPERATION_MIGRATION,
    );
    expect(r.ok).toBe(true);
  });
});

describe("4B-4V runControlledMigration harness", () => {
  it("plan-only with fake status (pending declared)", () => {
    const result = runControlledMigration({
      mode: "local-dry",
      databaseUrl: LOCAL_URL,
      planOnly: true,
      env: {
        [CONTROLLED_MIGRATE_MODE_ENV]: "local-dry",
        [CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV]: JOURNAL_SAVE_OPERATION_MIGRATION,
      },
      runStatus: () => ({
        status: 1,
        output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
      }),
      log: () => {},
    });
    expect(result.ok).toBe(true);
    expect(result.phase).toBe("plan");
    expect(result.pending).toEqual([JOURNAL_SAVE_OPERATION_MIGRATION]);
    expect(result.migrateWouldRun).toBe(true);
  });

  it("Production URL missing → migrate reject (fail-closed)", () => {
    const calls: string[] = [];
    const result = runControlledMigration({
      mode: "production",
      env: productionGatesEnv({
        [PRODUCTION_DATABASE_URL_ENV]: undefined,
        DATABASE_URL: LOCAL_URL,
      }),
      runStatus: () => {
        calls.push("status");
        return { status: 0, output: "Database schema is up to date!\n" };
      },
      runDeploy: () => {
        calls.push("deploy");
        return { status: 0, output: "Applied\n" };
      },
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("production_database_url_missing");
    expect(calls).toEqual([]);
  });

  it("localhost as Production URL → reject; deploy never reached", () => {
    const calls: string[] = [];
    const result = runControlledMigration({
      mode: "production",
      env: productionGatesEnv({
        [PRODUCTION_DATABASE_URL_ENV]: LOCAL_URL,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]:
          fingerprintDatabaseUrl(LOCAL_URL).fingerprint!,
      }),
      runStatus: () => {
        calls.push("status");
        return { status: 0, output: "up to date" };
      },
      runDeploy: () => {
        calls.push("deploy");
        return { status: 0, output: "Applied\n" };
      },
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("production_mode_points_at_local");
    expect(calls).toEqual([]);
  });

  it("Snapshot Gate missing → migrate reject; deploy never reached", () => {
    const calls: string[] = [];
    const result = runControlledMigration({
      mode: "production",
      env: productionGatesEnv({
        [PRE_SNAPSHOT_CREATED_ENV]: undefined,
      }),
      runStatus: () => {
        calls.push("status");
        return { status: 0, output: "up" };
      },
      runDeploy: () => {
        calls.push("deploy");
        return { status: 0, output: "Applied\n" };
      },
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("pre_snapshot_created_flag_missing");
    expect(calls).toEqual([]);
  });

  it("backup Gate missing → reject", () => {
    const calls: string[] = [];
    const result = runControlledMigration({
      mode: "production",
      env: productionGatesEnv({
        [CONTROLLED_MIGRATE_BACKUP_ENV]: undefined,
      }),
      runDeploy: () => {
        calls.push("deploy");
        return { status: 0, output: "Applied\n" };
      },
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("backup_gate_missing");
    expect(calls).toEqual([]);
  });

  it("wrong fingerprint → reject (V1)", () => {
    const result = runControlledMigration({
      mode: "production",
      planOnly: true,
      env: productionGatesEnv({
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: "deadbeefdeadbeef",
      }),
      runStatus: () => ({
        status: 1,
        output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
      }),
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("fingerprint_mismatch");
  });

  it("secret safety: logs never contain password or full URL", () => {
    const lines: string[] = [];
    runControlledMigration({
      mode: "production",
      planOnly: true,
      env: productionGatesEnv(),
      runStatus: () => ({
        status: 1,
        output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\nleak ${FAKE_NEON_URL}\n`,
      }),
      log: (line) => lines.push(line),
    });
    // Force a log path that would otherwise leak if redaction were skipped
    lines.push(
      redactSecretsInText(`manual ${FAKE_NEON_URL}`),
    );
    const joined = lines.join("\n");
    expect(joined).not.toContain("super_secret_pw");
    expect(joined).not.toContain(FAKE_NEON_URL);
    expect(joined).toContain(KNOWN_SNAPSHOT_AT);
    expect(joined).toContain("[redacted_database_url]");
  });

  it("deploy path calls deploy then verify (fake; no Neon)", () => {
    const calls: string[] = [];
    const result = runControlledMigration({
      mode: "local-dry",
      databaseUrl: LOCAL_URL,
      env: {
        [CONTROLLED_MIGRATE_MODE_ENV]: "local-dry",
        [CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV]: JOURNAL_SAVE_OPERATION_MIGRATION,
      },
      runStatus: () => {
        calls.push("status");
        return {
          status: 1,
          output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
        };
      },
      runDeploy: () => {
        calls.push("deploy");
        return { status: 0, output: "Applied\n" };
      },
      runVerify: () => {
        calls.push("verify");
        return { status: 0, detail: "table_ok" };
      },
      log: () => {},
    });
    expect(result.ok).toBe(true);
    expect(calls).toEqual(["status", "deploy", "verify"]);
  });

  it("V4 deploy failure stops before treating as success", () => {
    const result = runControlledMigration({
      mode: "local-dry",
      databaseUrl: LOCAL_URL,
      env: {
        [CONTROLLED_MIGRATE_MODE_ENV]: "local-dry",
        [CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV]: JOURNAL_SAVE_OPERATION_MIGRATION,
      },
      runStatus: () => ({
        status: 1,
        output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
      }),
      runDeploy: () => ({ status: 1, output: "fail" }),
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("deploy_failed");
  });
});

describe("4B-4V.1a read-only production preflight", () => {
  it("Production URL missing → reject", async () => {
    const r = await runProductionPreflight({
      env: { DATABASE_URL: LOCAL_URL },
      log: () => {},
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("production_database_url_missing");
    expect(r.calledMigrateDeploy).toBe(false);
  });

  it("localhost as Production → reject", async () => {
    const r = await runProductionPreflight({
      env: { [PRODUCTION_DATABASE_URL_ENV]: LOCAL_URL },
      log: () => {},
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("production_mode_points_at_local");
    expect(r.calledMigrateDeploy).toBe(false);
  });

  it("wrong fingerprint → reject", async () => {
    const r = await runProductionPreflight({
      env: {
        [PRODUCTION_DATABASE_URL_ENV]: FAKE_NEON_URL,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: "deadbeefdeadbeef",
      },
      log: () => {},
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("fingerprint_mismatch");
    expect(r.calledMigrateDeploy).toBe(false);
  });

  it("read-only path never invokes migrate deploy", async () => {
    const calls: string[] = [];
    const r = await runProductionPreflight({
      env: {
        [PRODUCTION_DATABASE_URL_ENV]: FAKE_NEON_URL,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]:
          fingerprintDatabaseUrl(FAKE_NEON_URL).fingerprint!,
      },
      runStatus: () => {
        calls.push("status");
        return {
          status: 1,
          output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
        };
      },
      runCounts: async () => {
        calls.push("counts");
        return {
          journalEntryCount: 10,
          donguriLedgerCount: 2,
          journalSaveOperationExists: false,
        };
      },
      log: () => {},
    });
    expect(r.ok).toBe(true);
    expect(r.calledMigrateDeploy).toBe(false);
    expect(calls).toEqual(["status", "counts"]);
    expect(r.pending).toEqual([JOURNAL_SAVE_OPERATION_MIGRATION]);
    expect(r.journalSaveOperationExists).toBe(false);
  });

  it("preflight module source has no migrate deploy spawn", () => {
    const src = readFileSync(
      path.join(process.cwd(), "scripts/production-preflight.mjs"),
      "utf8",
    );
    expect(src).not.toContain('"migrate", "deploy"');
    expect(src).not.toContain("'migrate', 'deploy'");
    expect(PREFLIGHT_FORBIDDEN_COMMANDS).toContain("prisma migrate deploy");
    // Only allowed prisma migrate invocation is status
    const spawnBlocks = [...src.matchAll(/spawnSync\(([\s\S]*?)\)/g)].map(
      (m) => m[1],
    );
    expect(spawnBlocks.length).toBeGreaterThan(0);
    for (const block of spawnBlocks) {
      expect(block).toContain("migrate");
      expect(block).toContain("status");
      expect(block).not.toContain("deploy");
    }
  });

  it("redactSecretsInText strips connection strings", () => {
    expect(redactSecretsInText(`err ${FAKE_NEON_URL} done`)).toBe(
      "err [redacted_database_url] done",
    );
  });
});

describe("4B-4V Strategy C: Vercel build never migrates", () => {
  it("production VERCEL_ENV also has no migrate in build", () => {
    const plan = resolveVercelBuildPlan("production");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(buildVercelCommandSteps(plan).map((s) => s.id)).toEqual([
      "prisma_generate",
      "next_build",
    ]);
  });

  it("preview remains without migrate", () => {
    expect(resolveVercelBuildPlan("preview").runMigrateDeploy).toBe(false);
  });
});

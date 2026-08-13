/**
 * 4B-4V controlled migration guards — local-dry only (no Neon).
 */

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
  assertModeDatabaseAllowed,
  assertOperatorGates,
  assertPendingMigrationsAllowed,
  fingerprintDatabaseUrl,
  parsePendingMigrationsFromStatus,
  runControlledMigration,
} from "./controlled-production-migrate.mjs";
import { resolveVercelBuildPlan, buildVercelCommandSteps } from "./vercel-build.mjs";

const LOCAL_URL =
  "postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public";

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
});

describe("4B-4V operator gates", () => {
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

describe("4B-4V runControlledMigration local-dry harness", () => {
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

  it("fingerprint mismatch blocks production (V1)", () => {
    const fp = fingerprintDatabaseUrl(
      "postgresql://u:p@ep-abc.neon.tech:5432/neondb",
    );
    const result = runControlledMigration({
      mode: "production",
      databaseUrl: "postgresql://u:p@ep-abc.neon.tech:5432/neondb",
      planOnly: true,
      env: {
        [CONTROLLED_MIGRATE_MODE_ENV]: "production",
        [CONTROLLED_MIGRATE_ALLOW_FLAG]: CONTROLLED_MIGRATE_ALLOW_VALUE,
        [CONTROLLED_MIGRATE_BACKUP_ENV]: CONTROLLED_MIGRATE_BACKUP_VALUE,
        [CONTROLLED_MIGRATE_FINGERPRINT_ENV]: "deadbeefdeadbeef",
        [CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV]: JOURNAL_SAVE_OPERATION_MIGRATION,
      },
      runStatus: () => ({
        status: 1,
        output: `Following migration have not yet been applied:\n${JOURNAL_SAVE_OPERATION_MIGRATION}\n`,
      }),
      log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("fingerprint_mismatch");
    expect(fp.fingerprint).not.toBe("deadbeefdeadbeef");
  });

  it("deploy path calls deploy then verify (fake; no Neon)", () => {
    /** @type {string[]} */
    const calls = [];
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

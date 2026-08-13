/**
 * 4B-4T.1 Preview migration gate + 4B-4V Strategy C (build never migrates).
 */

import { describe, expect, it } from "vitest";

import {
  buildVercelCommandSteps,
  parseVercelBuildArgv,
  resolveVercelBuildPlan,
  runVercelBuild,
} from "./vercel-build.mjs";

describe("4B-4T.1 / 4B-4V resolveVercelBuildPlan", () => {
  it("T1 VERCEL_ENV=preview → no migrate", () => {
    const plan = resolveVercelBuildPlan("preview");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(plan.kind).toBe("preview");
    const steps = buildVercelCommandSteps(plan);
    expect(steps.map((s) => s.id)).toEqual(["prisma_generate", "next_build"]);
    expect(steps.some((s) => s.id === "prisma_migrate_deploy")).toBe(false);
  });

  it("T2 VERCEL_ENV=production → no migrate in build (Strategy C)", () => {
    const plan = resolveVercelBuildPlan("production");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(plan.kind).toBe("production");
    const steps = buildVercelCommandSteps(plan);
    expect(steps.map((s) => s.id)).toEqual(["prisma_generate", "next_build"]);
  });

  it("T3 VERCEL_ENV=development → no migrate", () => {
    const plan = resolveVercelBuildPlan("development");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(plan.kind).toBe("development");
  });

  it("T4 VERCEL_ENV unset → no migrate (fail-safe)", () => {
    expect(resolveVercelBuildPlan(undefined).runMigrateDeploy).toBe(false);
    expect(resolveVercelBuildPlan(null).runMigrateDeploy).toBe(false);
    expect(resolveVercelBuildPlan("").runMigrateDeploy).toBe(false);
    expect(resolveVercelBuildPlan("   ").kind).toBe("unset");
  });

  it("T5 unknown value → no migrate (fail-safe)", () => {
    const plan = resolveVercelBuildPlan("staging");
    expect(plan.kind).toBe("unknown");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(resolveVercelBuildPlan("PRODUCTION").runMigrateDeploy).toBe(false);
    expect(resolveVercelBuildPlan("Production ").runMigrateDeploy).toBe(false);
  });
});

describe("4B-4T.1 / 4B-4V runVercelBuild dry harness", () => {
  it("T1 dry-run does not invoke migrate step callback", () => {
    /** @type {string[]} */
    const called = [];
    const result = runVercelBuild({
      vercelEnv: "preview",
      dryRun: true,
      log: () => {},
      runStep: (step) => {
        called.push(step.id);
        return 0;
      },
    });
    expect(called).toEqual([]);
    expect(result.executed).toEqual(["prisma_generate", "next_build"]);
    expect(result.plan.runMigrateDeploy).toBe(false);
  });

  it("T2 production build steps exclude migrate (fake; no DB)", () => {
    /** @type {string[]} */
    const called = [];
    const result = runVercelBuild({
      vercelEnv: "production",
      log: () => {},
      runStep: (step) => {
        called.push(step.id);
        return 0;
      },
    });
    expect(called).toEqual(["prisma_generate", "next_build"]);
    expect(result.exitCode).toBe(0);
  });

  it("plan-only exits 0 without executing", () => {
    /** @type {string[]} */
    const called = [];
    const result = runVercelBuild({
      vercelEnv: "production",
      planOnly: true,
      log: () => {},
      runStep: (step) => {
        called.push(step.id);
        return 0;
      },
    });
    expect(called).toEqual([]);
    expect(result.exitCode).toBe(0);
    expect(result.plan.runMigrateDeploy).toBe(false);
  });

  it("U-P1 preview plan excludes migrate even when official JournalSaveOperation migration exists", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const migDir = path.join(
      process.cwd(),
      "prisma/migrations/20260813140000_add_journal_save_operation/migration.sql",
    );
    expect(fs.existsSync(migDir)).toBe(true);
    const plan = resolveVercelBuildPlan("preview");
    expect(plan.runMigrateDeploy).toBe(false);
    const steps = buildVercelCommandSteps(plan);
    expect(steps.some((s) => s.id === "prisma_migrate_deploy")).toBe(false);
  });

  it("U-P3 / 4B-4V production build does not select migrate (controlled command instead)", () => {
    /** @type {string[]} */
    const called = [];
    const result = runVercelBuild({
      vercelEnv: "production",
      log: () => {},
      runStep: (step) => {
        called.push(step.id);
        return 0;
      },
    });
    expect(called).not.toContain("prisma_migrate_deploy");
    expect(result.plan.runMigrateDeploy).toBe(false);
  });

  it("parseVercelBuildArgv prefers --vercel-env over process env", () => {
    const parsed = parseVercelBuildArgv(
      ["--vercel-env=preview", "--plan-only"],
      { VERCEL_ENV: "production" },
    );
    expect(parsed.vercelEnv).toBe("preview");
    expect(parsed.planOnly).toBe(true);
  });
});

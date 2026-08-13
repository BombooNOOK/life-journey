/**
 * 4B-4T.1 Preview migration gate — T1–T5 (no Production Neon).
 */

import { describe, expect, it } from "vitest";

import {
  buildVercelCommandSteps,
  parseVercelBuildArgv,
  resolveVercelBuildPlan,
  runVercelBuild,
} from "./vercel-build.mjs";

describe("4B-4T.1 resolveVercelBuildPlan", () => {
  it("T1 VERCEL_ENV=preview → no migrate", () => {
    const plan = resolveVercelBuildPlan("preview");
    expect(plan.runMigrateDeploy).toBe(false);
    expect(plan.kind).toBe("preview");
    const steps = buildVercelCommandSteps(plan);
    expect(steps.map((s) => s.id)).toEqual(["prisma_generate", "next_build"]);
    expect(steps.some((s) => s.id === "prisma_migrate_deploy")).toBe(false);
  });

  it("T2 VERCEL_ENV=production → migrate selected (dry; no DB)", () => {
    const plan = resolveVercelBuildPlan("production");
    expect(plan.runMigrateDeploy).toBe(true);
    expect(plan.kind).toBe("production");
    const steps = buildVercelCommandSteps(plan);
    expect(steps.map((s) => s.id)).toEqual([
      "prisma_generate",
      "prisma_migrate_deploy",
      "next_build",
    ]);
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
    expect(resolveVercelBuildPlan("PRODUCTION").runMigrateDeploy).toBe(true); // case-insensitive exact production
    expect(resolveVercelBuildPlan("Production ").runMigrateDeploy).toBe(true);
  });
});

describe("4B-4T.1 runVercelBuild dry harness", () => {
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
    // dryRun skips runStep entirely
    expect(called).toEqual([]);
    expect(result.executed).toEqual(["prisma_generate", "next_build"]);
    expect(result.plan.runMigrateDeploy).toBe(false);
  });

  it("T2 fake harness records migrate without spawning prisma", () => {
    /** @type {string[]} */
    const called = [];
    const result = runVercelBuild({
      vercelEnv: "production",
      log: () => {},
      runStep: (step) => {
        called.push(step.id);
        // Never connect to Neon — fake success
        return 0;
      },
    });
    expect(called).toEqual([
      "prisma_generate",
      "prisma_migrate_deploy",
      "next_build",
    ]);
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
    expect(result.plan.runMigrateDeploy).toBe(true);
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

/**
 * Vercel build entry with Preview migration gate (4B-4T.1).
 *
 * - production → prisma generate && prisma migrate deploy && next build
 * - preview / development / unset / unknown → prisma generate && next build
 *   (NO prisma migrate deploy)
 *
 * Fail-safe: only exact VERCEL_ENV=production runs migrate.
 * Never prints DATABASE_URL or secrets.
 *
 * Usage:
 *   node scripts/vercel-build.mjs
 *   node scripts/vercel-build.mjs --plan-only
 *   node scripts/vercel-build.mjs --dry-run
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** @typedef {'production' | 'preview' | 'development' | 'unset' | 'unknown'} VercelEnvKind */

/**
 * @param {string | undefined | null} raw
 * @returns {{ kind: VercelEnvKind; normalized: string | null; runMigrateDeploy: boolean; reason: string }}
 */
export function resolveVercelBuildPlan(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return {
      kind: "unset",
      normalized: null,
      runMigrateDeploy: false,
      reason: "VERCEL_ENV_unset_fail_safe_no_migrate",
    };
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "production") {
    return {
      kind: "production",
      normalized,
      runMigrateDeploy: true,
      reason: "VERCEL_ENV_production_migrate_allowed",
    };
  }
  if (normalized === "preview") {
    return {
      kind: "preview",
      normalized,
      runMigrateDeploy: false,
      reason: "VERCEL_ENV_preview_no_migrate",
    };
  }
  if (normalized === "development") {
    return {
      kind: "development",
      normalized,
      runMigrateDeploy: false,
      reason: "VERCEL_ENV_development_no_migrate",
    };
  }
  return {
    kind: "unknown",
    normalized,
    runMigrateDeploy: false,
    reason: "VERCEL_ENV_unknown_fail_safe_no_migrate",
  };
}

/**
 * Ordered shell-safe command steps (no shell interpolation of secrets).
 * @param {{ runMigrateDeploy: boolean }} plan
 * @returns {Array<{ id: string; command: string; args: string[] }>}
 */
export function buildVercelCommandSteps(plan) {
  /** @type {Array<{ id: string; command: string; args: string[] }>} */
  const steps = [
    { id: "prisma_generate", command: "npx", args: ["prisma", "generate"] },
  ];
  if (plan.runMigrateDeploy) {
    steps.push({
      id: "prisma_migrate_deploy",
      command: "npx",
      args: ["prisma", "migrate", "deploy"],
    });
  }
  steps.push({ id: "next_build", command: "npx", args: ["next", "build"] });
  return steps;
}

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} [env]
 */
export function parseVercelBuildArgv(argv, env = process.env) {
  const planOnly = argv.includes("--plan-only");
  const dryRun = argv.includes("--dry-run");
  const envFlag = argv.find((a) => a.startsWith("--vercel-env="));
  const fromFlag = envFlag ? envFlag.slice("--vercel-env=".length) : undefined;
  const vercelEnv = fromFlag !== undefined ? fromFlag : env.VERCEL_ENV;
  return { planOnly, dryRun, vercelEnv };
}

/**
 * @param {{
 *   vercelEnv?: string | null;
 *   planOnly?: boolean;
 *   dryRun?: boolean;
 *   runStep?: (step: { id: string; command: string; args: string[] }) => number;
 *   log?: (line: string) => void;
 * }} options
 */
export function runVercelBuild(options = {}) {
  const log = options.log ?? ((line) => console.log(line));
  const plan = resolveVercelBuildPlan(options.vercelEnv);
  const steps = buildVercelCommandSteps(plan);

  log(`[vercel-build] VERCEL_ENV kind=${plan.kind} migrate=${String(plan.runMigrateDeploy)}`);
  log(`[vercel-build] reason=${plan.reason}`);
  for (const step of steps) {
    log(`[vercel-build] step=${step.id} :: ${step.command} ${step.args.join(" ")}`);
  }

  if (options.planOnly) {
    return { plan, steps, exitCode: 0, executed: [] };
  }

  /** @type {string[]} */
  const executed = [];
  const runStep =
    options.runStep ??
    ((step) => {
      const result = spawnSync(step.command, step.args, {
        stdio: "inherit",
        env: process.env,
        shell: false,
      });
      if (result.error) {
        log(`[vercel-build] failed to spawn ${step.id}: ${result.error.message}`);
        return 1;
      }
      return result.status === null ? 1 : result.status;
    });

  for (const step of steps) {
    if (options.dryRun) {
      executed.push(step.id);
      continue;
    }
    const code = runStep(step);
    executed.push(step.id);
    if (code !== 0) {
      log(`[vercel-build] step failed id=${step.id} code=${String(code)}`);
      return { plan, steps, exitCode: code, executed };
    }
  }

  return { plan, steps, exitCode: 0, executed };
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return self === invoked;
}

if (isMain()) {
  const { planOnly, dryRun, vercelEnv } = parseVercelBuildArgv(process.argv.slice(2));
  const result = runVercelBuild({ vercelEnv, planOnly, dryRun });
  process.exit(result.exitCode);
}

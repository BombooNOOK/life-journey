/**
 * Controlled production migration runner (4B-4V / 4B-4V.1a).
 *
 * NOT invoked by Vercel build / postinstall / next build / local `npm run dev`.
 * Operator-only. Never prints full DATABASE_URL or passwords.
 *
 * Production mode requires PRODUCTION_DATABASE_URL (never DATABASE_URL fallback)
 * and pre-snapshot gates before any path that can call migrate deploy.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

import {
  CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV,
  CONTROLLED_MIGRATE_MODE_ENV,
  JOURNAL_SAVE_OPERATION_MIGRATION,
  assertModeDatabaseAllowed,
  assertOperatorGates,
  assertPendingMigrationsAllowed,
  parsePendingMigrationsFromStatus,
  redactSecretsInText,
  resolveDatabaseUrlForMode,
} from "./lib/productionMigrateSafety.mjs";
// note: re-exports below for tests / consumers

export {
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
} from "./lib/productionMigrateSafety.mjs";

/**
 * @param {{
 *   mode: 'local-dry' | 'production';
 *   databaseUrl?: string;
 *   env?: NodeJS.ProcessEnv;
 *   planOnly?: boolean;
 *   verifyOnly?: boolean;
 *   runStatus?: () => { status: number; output: string };
 *   runDeploy?: () => { status: number; output: string };
 *   runVerify?: () => { status: number; detail: string };
 *   log?: (line: string) => void;
 * }} options
 */
export function runControlledMigration(options) {
  const rawLog = options.log ?? ((line) => console.log(line));
  const log = (line) => rawLog(redactSecretsInText(line));
  const env = options.env ?? process.env;
  const mode = options.mode;

  const gates = assertOperatorGates(env, mode);
  if (!gates.ok) {
    log(`[controlled-migrate] BLOCK ${gates.code}: ${gates.detail}`);
    return { ok: false, phase: "gates", code: gates.code, detail: gates.detail };
  }

  if (mode === "production" && gates.snapshotAt) {
    log(`[controlled-migrate] pre_snapshot_at=${gates.snapshotAt}`);
  }

  const resolved = resolveDatabaseUrlForMode(mode, env, options.databaseUrl);
  if (!resolved.ok) {
    log(`[controlled-migrate] BLOCK ${resolved.code}: ${resolved.detail}`);
    return {
      ok: false,
      phase: "url",
      code: resolved.code,
      detail: resolved.detail,
    };
  }

  const databaseUrl = resolved.databaseUrl;
  const id = assertModeDatabaseAllowed(databaseUrl, mode);
  if (!id.ok) {
    log(`[controlled-migrate] BLOCK ${id.code}: ${id.detail}`);
    return {
      ok: false,
      phase: "identity",
      code: id.code,
      detail: id.detail,
      label: id.fp?.label ?? null,
    };
  }

  if (mode === "production") {
    if (id.fp.fingerprint !== gates.expectedFingerprint) {
      log(
        `[controlled-migrate] BLOCK identity_mismatch: expected fingerprint does not match (V1)`,
      );
      return {
        ok: false,
        phase: "identity",
        code: "fingerprint_mismatch",
        detail: "V1 DB identity mismatch",
        label: id.fp.label,
      };
    }
  }

  log(
    `[controlled-migrate] mode=${mode} url_source=${resolved.source} target=${id.fp.label}`,
  );

  const statusRunner =
    options.runStatus ??
    (() => {
      const r = spawnSync("npx", ["prisma", "migrate", "status"], {
        env: { ...env, DATABASE_URL: databaseUrl },
        encoding: "utf8",
        shell: false,
      });
      return {
        status: r.status === null ? 1 : r.status,
        output: redactSecretsInText(`${r.stdout ?? ""}\n${r.stderr ?? ""}`),
      };
    });

  const statusResult = statusRunner();
  const pending = parsePendingMigrationsFromStatus(statusResult.output);
  log(`[controlled-migrate] pending_count=${pending.length}`);
  for (const name of pending) {
    log(`[controlled-migrate] pending=${name}`);
  }

  const expectedPending =
    mode === "local-dry"
      ? env[CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV] ??
        (pending.length ? pending.join(",") : "")
      : env[CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV];

  const pendingGate = assertPendingMigrationsAllowed(
    pending,
    expectedPending === "" ? undefined : expectedPending,
  );
  if (!pendingGate.ok && !(options.planOnly && mode === "local-dry" && pending.length === 0)) {
    if (!(options.planOnly && pending.length === 0)) {
      log(`[controlled-migrate] BLOCK ${pendingGate.code}: ${pendingGate.detail}`);
      return {
        ok: false,
        phase: "pending",
        code: pendingGate.code,
        detail: pendingGate.detail,
        pending: pendingGate.pending,
      };
    }
  }

  const sqlPath = path.join(
    process.cwd(),
    "prisma/migrations",
    JOURNAL_SAVE_OPERATION_MIGRATION,
    "migration.sql",
  );
  if (fs.existsSync(sqlPath)) {
    log(
      `[controlled-migrate] sql_review_path=prisma/migrations/${JOURNAL_SAVE_OPERATION_MIGRATION}/migration.sql`,
    );
  }

  if (options.planOnly) {
    return {
      ok: true,
      phase: "plan",
      code: "plan_only",
      pending,
      label: id.fp.label,
      fingerprint: id.fp.fingerprint,
      migrateWouldRun: pending.length > 0,
      snapshotAt: gates.snapshotAt ?? null,
    };
  }

  if (options.verifyOnly) {
    const verify =
      options.runVerify?.() ??
      ({ status: 1, detail: "verify_not_injected" });
    if (verify.status !== 0) {
      return {
        ok: false,
        phase: "verify",
        code: "verify_failed",
        detail: verify.detail,
      };
    }
    return { ok: true, phase: "verify", code: "verify_ok", detail: verify.detail };
  }

  // Hard stop: production deploy path requires snapshot gates already (assertOperatorGates).
  // Re-check immediately before spawn so tests can prove deploy is unreachable without snapshot.
  if (mode === "production") {
    const snapAgain = assertOperatorGates(env, "production");
    if (!snapAgain.ok) {
      log(`[controlled-migrate] BLOCK pre_deploy_gate ${snapAgain.code}`);
      return {
        ok: false,
        phase: "gates",
        code: snapAgain.code,
        detail: snapAgain.detail,
      };
    }
  }

  if (pending.length === 0) {
    log(`[controlled-migrate] nothing_to_apply`);
    return {
      ok: true,
      phase: "deploy",
      code: "already_up_to_date",
      pending: [],
      label: id.fp.label,
    };
  }

  const deployRunner =
    options.runDeploy ??
    (() => {
      const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
        env: { ...env, DATABASE_URL: databaseUrl },
        encoding: "utf8",
        shell: false,
      });
      return {
        status: r.status === null ? 1 : r.status,
        output: redactSecretsInText(`${r.stdout ?? ""}\n${r.stderr ?? ""}`),
      };
    });

  const deployed = deployRunner();
  if (deployed.status !== 0) {
    log(`[controlled-migrate] BLOCK deploy_failed (V4)`);
    return {
      ok: false,
      phase: "deploy",
      code: "deploy_failed",
      detail: "V4 migration command failure — do not app-deploy",
    };
  }

  const verify =
    options.runVerify?.() ??
    ({ status: 0, detail: "skipped_default_verify" });
  if (verify.status !== 0) {
    log(`[controlled-migrate] BLOCK verify_failed (V5)`);
    return {
      ok: false,
      phase: "verify",
      code: "verify_failed_after_migrate",
      detail: "V5 keep feature OFF; investigate",
    };
  }

  return {
    ok: true,
    phase: "deploy",
    code: "deployed",
    pending,
    label: id.fp.label,
  };
}

function parseArgv(argv) {
  const planOnly = argv.includes("--plan-only");
  const verifyOnly = argv.includes("--verify-only");
  const modeFlag = argv.find((a) => a.startsWith("--mode="));
  const modeRaw = modeFlag
    ? modeFlag.slice("--mode=".length)
    : process.env[CONTROLLED_MIGRATE_MODE_ENV];
  /** @type {'local-dry' | 'production' | null} */
  let mode = null;
  if (modeRaw === "local-dry" || modeRaw === "production") mode = modeRaw;
  return { planOnly, verifyOnly, mode };
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return self === invoked;
}

if (isMain()) {
  const { planOnly, verifyOnly, mode } = parseArgv(process.argv.slice(2));
  if (!mode) {
    console.error(
      `[controlled-migrate] refuse: set --mode=local-dry|production and ${CONTROLLED_MIGRATE_MODE_ENV}`,
    );
    process.exit(2);
  }
  const result = runControlledMigration({
    mode,
    planOnly,
    verifyOnly,
    env: {
      ...process.env,
      [CONTROLLED_MIGRATE_MODE_ENV]: mode,
    },
  });
  process.exit(result.ok ? 0 : 1);
}

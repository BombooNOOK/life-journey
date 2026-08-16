/**
 * Production read-only preflight (4B-4V.1a).
 *
 * Structural guarantee: this module NEVER imports or spawns `prisma migrate deploy`.
 * Uses PRODUCTION_DATABASE_URL only (never DATABASE_URL as Production).
 * Never prints full URL / password.
 *
 * Usage:
 *   node scripts/production-preflight.mjs
 *   npm run db:preflight:production
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

import {
  CONTROLLED_MIGRATE_FINGERPRINT_ENV,
  JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION,
  JOURNAL_SAVE_OPERATION_MIGRATION,
  PRODUCTION_DATABASE_URL_ENV,
  assertModeDatabaseAllowed,
  fingerprintDatabaseUrl,
  parsePendingMigrationsFromStatus,
  redactSecretsInText,
  resolveDatabaseUrlForMode,
} from "./lib/productionMigrateSafety.mjs";

/** Defense-in-depth: reject if caller tries to smuggle deploy. */
export const PREFLIGHT_FORBIDDEN_COMMANDS = Object.freeze([
  "migrate deploy",
  "prisma migrate deploy",
]);
export const PREFLIGHT_FORBIDDEN_SQL_KEYWORDS = Object.freeze([
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
]);

/**
 * @param {{
 *   env?: NodeJS.ProcessEnv;
 *   databaseUrl?: string;
 *   expectFingerprint?: string | null;
 *   runStatus?: () => { status: number; output: string };
 *   runCounts?: () => Promise<{
 *     journalEntryCount: number | null;
 *     donguriLedgerCount: number | null;
 *     journalSaveOperationExists: boolean | null;
 *     journalSaveOperationRowCount: number | null;
 *     journalSaveIdempotencyRolloutExists: boolean | null;
 *     journalSaveIdempotencyRolloutRowCount: number | null;
 *     appliedMigrations: string[] | null;
 *   }>;
 *   log?: (line: string) => void;
 * }} options
 */
export async function runProductionPreflight(options = {}) {
  const rawLog = options.log ?? ((line) => console.log(line));
  const log = (line) => rawLog(redactSecretsInText(line));
  const env = options.env ?? process.env;

  const resolved = resolveDatabaseUrlForMode(
    "production",
    env,
    options.databaseUrl,
  );
  if (!resolved.ok) {
    log(`[preflight] BLOCK ${resolved.code}: ${resolved.detail}`);
    return {
      ok: false,
      phase: "url",
      code: resolved.code,
      detail: resolved.detail,
      calledMigrateDeploy: false,
    };
  }

  const id = assertModeDatabaseAllowed(resolved.databaseUrl, "production");
  if (!id.ok) {
    log(`[preflight] BLOCK ${id.code}: ${id.detail}`);
    return {
      ok: false,
      phase: "identity",
      code: id.code,
      detail: id.detail,
      label: id.fp?.label ?? null,
      calledMigrateDeploy: false,
    };
  }

  const expectedFingerprint =
    options.expectFingerprint !== undefined
      ? options.expectFingerprint
      : (env[CONTROLLED_MIGRATE_FINGERPRINT_ENV] || "").trim() || null;
  if (expectedFingerprint && id.fp.fingerprint !== expectedFingerprint) {
    log(`[preflight] BLOCK fingerprint_mismatch`);
    return {
      ok: false,
      phase: "identity",
      code: "fingerprint_mismatch",
      detail: "expected fingerprint does not match PRODUCTION_DATABASE_URL",
      label: id.fp.label,
      fingerprint: id.fp.fingerprint,
      calledMigrateDeploy: false,
    };
  }

  log(
    `[preflight] url_source=${resolved.source} target=${id.fp.label} fingerprint=${id.fp.fingerprint}`,
  );

  const statusRunner =
    options.runStatus ??
    (() => {
      const r = spawnSync("npx", ["prisma", "migrate", "status"], {
        env: { ...env, DATABASE_URL: resolved.databaseUrl },
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
  log(`[preflight] pending_count=${pending.length}`);
  for (const name of pending) {
    log(`[preflight] pending=${name}`);
  }

  const counts =
    (await options.runCounts?.()) ??
    (await defaultReadOnlyCounts(resolved.databaseUrl));

  const migrationState = evaluateStage0MigrationState({
    appliedMigrations: counts.appliedMigrations,
    pending,
    journalSaveOperationExists: counts.journalSaveOperationExists,
    journalSaveIdempotencyRolloutExists:
      counts.journalSaveIdempotencyRolloutExists,
  });

  log(
    `[preflight] applied_migration_count=${String(counts.appliedMigrations?.length ?? null)} journalEntryCount=${String(counts.journalEntryCount)} donguriLedgerCount=${String(counts.donguriLedgerCount)}`,
  );
  for (const name of counts.appliedMigrations ?? []) {
    log(`[preflight] applied=${name}`);
  }
  log(
    `[preflight] journalSaveOperation_exists=${String(counts.journalSaveOperationExists)} journalSaveOperation_row_count=${String(counts.journalSaveOperationRowCount)} rollout_exists=${String(counts.journalSaveIdempotencyRolloutExists)} rollout_row_count=${String(counts.journalSaveIdempotencyRolloutRowCount)}`,
  );
  log(
    `[preflight] stage0_state=${migrationState.code} detail=${migrationState.detail}`,
  );

  return {
    ok: migrationState.ok,
    phase: "preflight",
    code: migrationState.code,
    detail: migrationState.detail,
    label: id.fp.label,
    fingerprint: id.fp.fingerprint,
    pending,
    journalEntryCount: counts.journalEntryCount,
    donguriLedgerCount: counts.donguriLedgerCount,
    journalSaveOperationExists: counts.journalSaveOperationExists,
    journalSaveOperationRowCount: counts.journalSaveOperationRowCount,
    journalSaveIdempotencyRolloutExists:
      counts.journalSaveIdempotencyRolloutExists,
    journalSaveIdempotencyRolloutRowCount:
      counts.journalSaveIdempotencyRolloutRowCount,
    appliedMigrations: counts.appliedMigrations,
    migrationState,
    calledMigrateDeploy: false,
  };
}

/**
 * Stage 0 expected database state before the additive rollout migration.
 * Differences are observations only: preflight never mutates to correct them.
 */
export function evaluateStage0MigrationState({
  appliedMigrations,
  pending,
  journalSaveOperationExists,
  journalSaveIdempotencyRolloutExists,
}) {
  if (!appliedMigrations) {
    return {
      ok: false,
      code: "stage0_hold_migration_history_unreadable",
      detail: "Prisma migration history could not be observed",
    };
  }
  const jsoApplied = appliedMigrations.includes(JOURNAL_SAVE_OPERATION_MIGRATION);
  const rolloutApplied = appliedMigrations.includes(
    JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION,
  );
  const onlyRolloutPending =
    pending.length === 1 && pending[0] === JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION;
  const expected =
    jsoApplied &&
    !rolloutApplied &&
    onlyRolloutPending &&
    journalSaveOperationExists === true &&
    journalSaveIdempotencyRolloutExists === false;

  if (expected) {
    return {
      ok: true,
      code: "stage0_expected_rollout_pending",
      detail: "JSO applied; rollout is the sole pending migration and table is absent",
    };
  }

  return {
    ok: false,
    code: "stage0_hold_migration_state_mismatch",
    detail:
      "expected JSO applied, rollout sole pending, JSO table present, rollout table absent",
  };
}

/**
 * @param {string} databaseUrl
 */
async function defaultReadOnlyCounts(databaseUrl) {
  // Lazy Prisma only when actually connecting — tests inject runCounts.
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  try {
    const journalEntryCount = await prisma.journalEntry.count();
    const appliedRows = await prisma.$queryRawUnsafe(
      `SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at IS NOT NULL
       ORDER BY finished_at ASC`,
    );
    const appliedMigrations = appliedRows.map((row) => row.migration_name);
    const tableRows = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public'
       AND table_name IN ('JournalSaveOperation', 'JournalSaveIdempotencyRollout')`,
    );
    const tableNames = new Set(tableRows.map((row) => row.table_name));
    const journalSaveOperationExists = tableNames.has("JournalSaveOperation");
    const journalSaveIdempotencyRolloutExists = tableNames.has(
      "JournalSaveIdempotencyRollout",
    );
    let donguriLedgerCount = null;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as c FROM "LogHouseDonguriLedgerEntry"`,
      );
      donguriLedgerCount = rows[0]?.c ?? 0;
    } catch {
      donguriLedgerCount = null;
    }
    const journalSaveOperationRowCount = journalSaveOperationExists
      ? await countTableRows(prisma, "JournalSaveOperation")
      : null;
    const journalSaveIdempotencyRolloutRowCount =
      journalSaveIdempotencyRolloutExists
        ? await countTableRows(prisma, "JournalSaveIdempotencyRollout")
        : null;
    return {
      journalEntryCount,
      donguriLedgerCount,
      journalSaveOperationExists,
      journalSaveOperationRowCount,
      journalSaveIdempotencyRolloutExists,
      journalSaveIdempotencyRolloutRowCount,
      appliedMigrations,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function countTableRows(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as c FROM "${tableName}"`,
  );
  return rows[0]?.c ?? 0;
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return self === invoked;
}

if (isMain()) {
  // Structural: never pass migrate deploy args
  if (process.argv.some((a) => /migrate/.test(a) && /deploy/.test(a))) {
    console.error("[preflight] refuse: migrate deploy is forbidden in preflight");
    process.exit(2);
  }
  runProductionPreflight({})
    .then((r) => process.exit(r.ok ? 0 : 1))
    .catch((e) => {
      console.error(redactSecretsInText(String(e)));
      process.exit(1);
    });
}

// Re-export for tests that assert no deploy surface
export {
  fingerprintDatabaseUrl,
  JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION,
  JOURNAL_SAVE_OPERATION_MIGRATION,
  PRODUCTION_DATABASE_URL_ENV,
};

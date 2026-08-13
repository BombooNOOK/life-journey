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

  log(
    `[preflight] journalEntryCount=${String(counts.journalEntryCount)} donguriLedgerCount=${String(counts.donguriLedgerCount)} journalSaveOperationExists=${String(counts.journalSaveOperationExists)}`,
  );

  return {
    ok: true,
    phase: "preflight",
    code: "preflight_ok",
    label: id.fp.label,
    fingerprint: id.fp.fingerprint,
    pending,
    journalEntryCount: counts.journalEntryCount,
    donguriLedgerCount: counts.donguriLedgerCount,
    journalSaveOperationExists: counts.journalSaveOperationExists,
    calledMigrateDeploy: false,
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
    let donguriLedgerCount = null;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as c FROM "LogHouseDonguriLedgerEntry"`,
      );
      donguriLedgerCount = rows[0]?.c ?? 0;
    } catch {
      donguriLedgerCount = null;
    }
    let journalSaveOperationExists = null;
    try {
      const exists = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public' AND table_name='JournalSaveOperation'`,
      );
      journalSaveOperationExists = Boolean(exists[0]?.c);
    } catch {
      journalSaveOperationExists = null;
    }
    return {
      journalEntryCount,
      donguriLedgerCount,
      journalSaveOperationExists,
    };
  } finally {
    await prisma.$disconnect();
  }
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
export { fingerprintDatabaseUrl, PRODUCTION_DATABASE_URL_ENV };

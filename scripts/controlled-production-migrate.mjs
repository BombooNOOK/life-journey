/**
 * Controlled production migration runner (4B-4V).
 *
 * NOT invoked by Vercel build / postinstall / next build / local `npm run dev`.
 * Operator-only. Never prints full DATABASE_URL or passwords.
 *
 * Real Prisma capabilities used:
 * - `prisma migrate status` (pending / up-to-date)
 * - `prisma migrate deploy` (apply pending — only after gates)
 * There is NO official Prisma "dry-run deploy"; plan = status + SQL review.
 *
 * Modes:
 * - local-dry: 127.0.0.1:5433/ljd_dev only (harness)
 * - production: requires explicit allow flags + fingerprint match
 *   (4B-4V does not execute production mode against Neon)
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

export const CONTROLLED_MIGRATE_ALLOW_FLAG = "LJD_ALLOW_PRODUCTION_MIGRATION";
export const CONTROLLED_MIGRATE_ALLOW_VALUE = "YES";
export const CONTROLLED_MIGRATE_MODE_ENV = "LJD_CONTROLLED_MIGRATE_MODE";
export const CONTROLLED_MIGRATE_FINGERPRINT_ENV = "LJD_EXPECTED_DB_FINGERPRINT";
export const CONTROLLED_MIGRATE_BACKUP_ENV = "LJD_PRODUCTION_BACKUP_CONFIRMED";
export const CONTROLLED_MIGRATE_BACKUP_VALUE = "YES";
export const CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV =
  "LJD_EXPECTED_PENDING_MIGRATIONS";

/** Candidate migration for next Production apply Phase (4B-4V.1). */
export const JOURNAL_SAVE_OPERATION_MIGRATION =
  "20260813140000_add_journal_save_operation";

/**
 * Redacted DB identity fingerprint (no password / user).
 * Format: sha256(host|port|database).slice(0,16) + human label.
 * @param {string | undefined} databaseUrl
 */
export function fingerprintDatabaseUrl(databaseUrl) {
  if (!databaseUrl?.trim()) {
    return {
      ok: false,
      reason: "DATABASE_URL_missing",
      fingerprint: null,
      label: null,
      host: null,
      port: null,
      database: null,
    };
  }
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return {
      ok: false,
      reason: "DATABASE_URL_unparseable",
      fingerprint: null,
      label: null,
      host: null,
      port: null,
      database: null,
    };
  }
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol.startsWith("postgres") ? "5432" : "");
  const database = parsed.pathname.replace(/^\//, "").split("?")[0] || "";
  const material = `${host}|${port}|${database}`;
  const hash = createHash("sha256").update(material).digest("hex").slice(0, 16);
  const hostRedacted =
    host.length <= 8 ? "[host]" : `${host.slice(0, 3)}…${host.slice(-3)}`;
  const dbRedacted =
    database.length <= 6 ? "[db]" : `${database.slice(0, 3)}…${database.slice(-3)}`;
  return {
    ok: true,
    reason: "ok",
    fingerprint: hash,
    label: `${hostRedacted}:${port}/${dbRedacted}#${hash}`,
    host,
    port,
    database,
  };
}

/**
 * @param {string | undefined} databaseUrl
 * @param {'local-dry' | 'production'} mode
 */
export function assertModeDatabaseAllowed(databaseUrl, mode) {
  const fp = fingerprintDatabaseUrl(databaseUrl);
  if (!fp.ok) {
    return { ok: false, code: "identity_unreadable", detail: fp.reason, fp };
  }
  if (mode === "local-dry") {
    const local =
      (fp.host === "127.0.0.1" || fp.host === "localhost") &&
      fp.port === "5433" &&
      fp.database === "ljd_dev";
    const neonLike = (fp.host || "").includes("neon");
    if (neonLike || !local) {
      return {
        ok: false,
        code: "local_dry_identity_mismatch",
        detail: "local-dry requires 127.0.0.1:5433/ljd_dev only",
        fp,
      };
    }
    return { ok: true, code: "local_dry_ok", detail: "ok", fp };
  }
  // production mode: must NOT be local disposable (operator must target real prod)
  if (
    (fp.host === "127.0.0.1" || fp.host === "localhost") &&
    fp.port === "5433"
  ) {
    return {
      ok: false,
      code: "production_mode_points_at_local",
      detail: "production mode refused for local disposable DB",
      fp,
    };
  }
  return { ok: true, code: "production_identity_shape_ok", detail: "ok", fp };
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {'local-dry' | 'production'} mode
 */
export function assertOperatorGates(env, mode) {
  if (mode === "local-dry") {
    if (env[CONTROLLED_MIGRATE_MODE_ENV] !== "local-dry") {
      return {
        ok: false,
        code: "mode_flag_missing",
        detail: `${CONTROLLED_MIGRATE_MODE_ENV}=local-dry required`,
      };
    }
    return { ok: true, code: "local_dry_gates_ok", detail: "ok" };
  }

  if (env[CONTROLLED_MIGRATE_MODE_ENV] !== "production") {
    return {
      ok: false,
      code: "mode_flag_missing",
      detail: `${CONTROLLED_MIGRATE_MODE_ENV}=production required`,
    };
  }
  if (env[CONTROLLED_MIGRATE_ALLOW_FLAG] !== CONTROLLED_MIGRATE_ALLOW_VALUE) {
    return {
      ok: false,
      code: "allow_flag_missing",
      detail: `${CONTROLLED_MIGRATE_ALLOW_FLAG}=${CONTROLLED_MIGRATE_ALLOW_VALUE} required`,
    };
  }
  if (env[CONTROLLED_MIGRATE_BACKUP_ENV] !== CONTROLLED_MIGRATE_BACKUP_VALUE) {
    return {
      ok: false,
      code: "backup_gate_missing",
      detail: `${CONTROLLED_MIGRATE_BACKUP_ENV}=${CONTROLLED_MIGRATE_BACKUP_VALUE} required (V3)`,
    };
  }
  const expected = (env[CONTROLLED_MIGRATE_FINGERPRINT_ENV] || "").trim();
  if (!expected) {
    return {
      ok: false,
      code: "fingerprint_missing",
      detail: `${CONTROLLED_MIGRATE_FINGERPRINT_ENV} required`,
    };
  }
  return {
    ok: true,
    code: "production_gates_ok",
    detail: "ok",
    expectedFingerprint: expected,
  };
}

/**
 * Parse `prisma migrate status` stdout/stderr for pending migration names.
 * Relies on Prisma's conventional "Following migration have not yet been applied:" listing.
 * @param {string} output
 */
export function parsePendingMigrationsFromStatus(output) {
  const lines = output.split(/\r?\n/);
  /** @type {string[]} */
  const pending = [];
  let inPending = false;
  for (const line of lines) {
    if (/have not yet been applied/i.test(line) || /not yet been applied/i.test(line)) {
      inPending = true;
      continue;
    }
    if (inPending) {
      if (!line.trim()) {
        if (pending.length) break;
        continue;
      }
      if (/Database schema is up to date/i.test(line)) break;
      if (/migrations found/i.test(line)) continue;
      if (/Following migration/i.test(line)) continue;
      const name = line.trim().replace(/^[*/\-\d.\s]+/, "").trim();
      // Prefer lines that look like migration folder names
      const m = line.match(/(20\d{12}_[a-z0-9_]+)/i);
      if (m) pending.push(m[1]);
      else if (/^\d{14}_/.test(name)) pending.push(name);
    }
  }
  if (/Database schema is up to date/i.test(output)) {
    return [];
  }
  return [...new Set(pending)];
}

/**
 * @param {string[]} pending
 * @param {string | undefined} expectedCsv
 */
export function assertPendingMigrationsAllowed(pending, expectedCsv) {
  if (!expectedCsv?.trim()) {
    // Without explicit allowlist, refuse if ANY pending (forces operator to declare)
    if (pending.length === 0) {
      return {
        ok: true,
        code: "no_pending",
        detail: "no pending migrations",
        pending,
      };
    }
    return {
      ok: false,
      code: "unexpected_pending_migrations",
      detail:
        "Set LJD_EXPECTED_PENDING_MIGRATIONS to the exact comma-separated pending list (V2)",
      pending,
    };
  }
  const expected = expectedCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
  const got = [...pending].sort();
  if (expected.length !== got.length || expected.some((e, i) => e !== got[i])) {
    return {
      ok: false,
      code: "pending_mismatch",
      detail: "pending migrations do not match LJD_EXPECTED_PENDING_MIGRATIONS (V2)",
      pending: got,
      expected,
    };
  }
  return { ok: true, code: "pending_match", detail: "ok", pending: got, expected };
}

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
  const log = options.log ?? ((line) => console.log(line));
  const env = options.env ?? process.env;
  const databaseUrl = options.databaseUrl ?? env.DATABASE_URL;
  const mode = options.mode;

  const gates = assertOperatorGates(env, mode);
  if (!gates.ok) {
    log(`[controlled-migrate] BLOCK ${gates.code}: ${gates.detail}`);
    return { ok: false, phase: "gates", code: gates.code, detail: gates.detail };
  }

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

  log(`[controlled-migrate] mode=${mode} target=${id.fp.label}`);

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
        output: `${r.stdout ?? ""}\n${r.stderr ?? ""}`,
      };
    });

  const statusResult = statusRunner();
  // migrate status exits 1 when pending exist — still parse output
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
    // local-dry plan with zero pending is OK without allowlist
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
    log(`[controlled-migrate] sql_review_path=prisma/migrations/${JOURNAL_SAVE_OPERATION_MIGRATION}/migration.sql`);
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

  // Production: refuse deploy inside 4B-4V automation unless explicitly allowed —
  // still requires all gates; this Phase's tests never set production+real Neon.
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
        output: `${r.stdout ?? ""}\n${r.stderr ?? ""}`,
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
  const modeRaw = modeFlag ? modeFlag.slice("--mode=".length) : process.env[CONTROLLED_MIGRATE_MODE_ENV];
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

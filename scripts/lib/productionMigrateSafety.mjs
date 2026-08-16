/**
 * Shared Production migration / preflight safety helpers (4B-4V.1a).
 * Never prints full DATABASE_URL or passwords.
 */

import { createHash } from "node:crypto";

export const CONTROLLED_MIGRATE_ALLOW_FLAG = "LJD_ALLOW_PRODUCTION_MIGRATION";
export const CONTROLLED_MIGRATE_ALLOW_VALUE = "YES";
export const CONTROLLED_MIGRATE_MODE_ENV = "LJD_CONTROLLED_MIGRATE_MODE";
export const CONTROLLED_MIGRATE_FINGERPRINT_ENV = "LJD_EXPECTED_DB_FINGERPRINT";
export const CONTROLLED_MIGRATE_BACKUP_ENV = "LJD_PRODUCTION_BACKUP_CONFIRMED";
export const CONTROLLED_MIGRATE_BACKUP_VALUE = "YES";
export const CONTROLLED_MIGRATE_EXPECTED_PENDING_ENV =
  "LJD_EXPECTED_PENDING_MIGRATIONS";
export const CONTROLLED_MIGRATE_TARGET_ENV = "LJD_CONTROLLED_MIGRATE_TARGET";

/** Explicit Production URL only — never fall back to DATABASE_URL. */
export const PRODUCTION_DATABASE_URL_ENV = "PRODUCTION_DATABASE_URL";

export const PRE_SNAPSHOT_REQUIRED_ENV =
  "LJD_PRODUCTION_MIGRATION_PRE_SNAPSHOT_REQUIRED";
export const PRE_SNAPSHOT_REQUIRED_VALUE = "YES";
export const PRE_SNAPSHOT_CREATED_ENV = "LJD_PRODUCTION_PRE_SNAPSHOT_CREATED";
export const PRE_SNAPSHOT_CREATED_VALUE = "YES";
/** Non-secret metadata, e.g. 2026-08-13T06:43:21Z */
export const PRE_SNAPSHOT_AT_ENV = "LJD_PRODUCTION_PRE_SNAPSHOT_AT";

export const JOURNAL_SAVE_OPERATION_MIGRATION =
  "20260813140000_add_journal_save_operation";
export const JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION =
  "20260814231500_add_journal_save_idempotency_rollout";

/**
 * Closed, code-reviewed registry. An operator-supplied ID must resolve here;
 * it cannot name an arbitrary migration directory or SQL file.
 */
export const APPROVED_PRODUCTION_MIGRATIONS = Object.freeze({
  [JOURNAL_SAVE_OPERATION_MIGRATION]: {
    id: JOURNAL_SAVE_OPERATION_MIGRATION,
    sqlRelativePath: `prisma/migrations/${JOURNAL_SAVE_OPERATION_MIGRATION}/migration.sql`,
  },
  [JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION]: {
    id: JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION,
    sqlRelativePath: `prisma/migrations/${JOURNAL_SAVE_IDEMPOTENCY_ROLLOUT_MIGRATION}/migration.sql`,
  },
});

/**
 * @param {string | undefined} targetMigrationId
 */
export function resolveApprovedProductionMigrationTarget(targetMigrationId) {
  const id = targetMigrationId?.trim();
  if (!id) {
    return {
      ok: false,
      code: "target_migration_missing",
      detail: `${CONTROLLED_MIGRATE_TARGET_ENV} must name one approved migration`,
    };
  }
  const target = APPROVED_PRODUCTION_MIGRATIONS[id];
  if (!target) {
    return {
      ok: false,
      code: "target_migration_unknown",
      detail: "target migration is not in the code-reviewed Production registry",
    };
  }
  return { ok: true, target };
}

/**
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

export function isLocalDisposableTarget(fp) {
  return (
    (fp.host === "127.0.0.1" || fp.host === "localhost") &&
    fp.port === "5433" &&
    fp.database === "ljd_dev"
  );
}

export function isLocalhostLike(fp) {
  return (
    fp.host === "127.0.0.1" ||
    fp.host === "localhost" ||
    fp.host === "::1"
  );
}

/**
 * Resolve URL for mode. Production NEVER uses DATABASE_URL.
 * @param {'local-dry' | 'production'} mode
 * @param {NodeJS.ProcessEnv} env
 * @param {string | undefined} override
 */
export function resolveDatabaseUrlForMode(mode, env, override) {
  if (override?.trim()) {
    return { ok: true, databaseUrl: override.trim(), source: "override" };
  }
  if (mode === "local-dry") {
    const url = env.DATABASE_URL?.trim();
    if (!url) {
      return {
        ok: false,
        code: "local_database_url_missing",
        detail: "DATABASE_URL required for local-dry",
      };
    }
    return { ok: true, databaseUrl: url, source: "DATABASE_URL" };
  }
  const url = env[PRODUCTION_DATABASE_URL_ENV]?.trim();
  if (!url) {
    return {
      ok: false,
      code: "production_database_url_missing",
      detail: `${PRODUCTION_DATABASE_URL_ENV} required; DATABASE_URL must not be used as Production`,
    };
  }
  // Fail-closed if operator also pointed DATABASE_URL at same value? Not needed.
  // Explicitly refuse if somehow empty after trim already handled.
  return { ok: true, databaseUrl: url, source: PRODUCTION_DATABASE_URL_ENV };
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
    const neonLike = (fp.host || "").includes("neon");
    if (neonLike || !isLocalDisposableTarget(fp)) {
      return {
        ok: false,
        code: "local_dry_identity_mismatch",
        detail: "local-dry requires 127.0.0.1:5433/ljd_dev only",
        fp,
      };
    }
    return { ok: true, code: "local_dry_ok", detail: "ok", fp };
  }
  if (isLocalhostLike(fp) || isLocalDisposableTarget(fp)) {
    return {
      ok: false,
      code: "production_mode_points_at_local",
      detail: "production refused for localhost / local disposable DB",
      fp,
    };
  }
  return { ok: true, code: "production_identity_shape_ok", detail: "ok", fp };
}

/**
 * Snapshot Gate — production migrate must not proceed without these.
 * @param {NodeJS.ProcessEnv} env
 */
export function assertPreSnapshotGates(env) {
  if (env[PRE_SNAPSHOT_REQUIRED_ENV] !== PRE_SNAPSHOT_REQUIRED_VALUE) {
    return {
      ok: false,
      code: "pre_snapshot_required_flag_missing",
      detail: `${PRE_SNAPSHOT_REQUIRED_ENV}=${PRE_SNAPSHOT_REQUIRED_VALUE} required (V3b)`,
    };
  }
  if (env[PRE_SNAPSHOT_CREATED_ENV] !== PRE_SNAPSHOT_CREATED_VALUE) {
    return {
      ok: false,
      code: "pre_snapshot_created_flag_missing",
      detail: `${PRE_SNAPSHOT_CREATED_ENV}=${PRE_SNAPSHOT_CREATED_VALUE} required (V3b)`,
    };
  }
  const at = (env[PRE_SNAPSHOT_AT_ENV] || "").trim();
  if (!at) {
    return {
      ok: false,
      code: "pre_snapshot_at_missing",
      detail: `${PRE_SNAPSHOT_AT_ENV} required (non-secret timestamp metadata)`,
    };
  }
  return {
    ok: true,
    code: "pre_snapshot_ok",
    detail: "ok",
    snapshotAt: at,
  };
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
  const snap = assertPreSnapshotGates(env);
  if (!snap.ok) {
    return snap;
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
    snapshotAt: snap.snapshotAt,
  };
}

/**
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

/** Strip accidental connection-string-looking substrings from logs. */
export function redactSecretsInText(text) {
  return String(text || "")
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[redacted_database_url]")
    .replace(/postgresql:\/\/[^\s"'`]+/gi, "[redacted_database_url]");
}

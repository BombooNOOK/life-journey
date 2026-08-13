/**
 * Hard gate: only disposable local Postgres may run 4B-4P DDL / integration.
 * Never prints secrets.
 */

export type LocalDisposableDbAudit = {
  ok: boolean;
  host: string | null;
  port: string | null;
  database: string | null;
  isLocalLoopback: boolean;
  isNeonLike: boolean;
  reason: string;
};

export function auditDatabaseUrlForNonprodIdempotency(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): LocalDisposableDbAudit {
  if (!databaseUrl?.trim()) {
    return {
      ok: false,
      host: null,
      port: null,
      database: null,
      isLocalLoopback: false,
      isNeonLike: false,
      reason: "DATABASE_URL_missing",
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return {
      ok: false,
      host: null,
      port: null,
      database: null,
      isLocalLoopback: false,
      isNeonLike: false,
      reason: "DATABASE_URL_unparseable",
    };
  }
  const host = parsed.hostname;
  const port = parsed.port || (parsed.protocol === "postgresql:" ? "5432" : "");
  const database = parsed.pathname.replace(/^\//, "").split("?")[0] || null;
  const isNeonLike =
    host.includes("neon.tech") ||
    host.includes("neon") ||
    host.endsWith(".aws.neon.tech");
  const isLocalLoopback = host === "127.0.0.1" || host === "localhost";
  const isExpectedDevPort = port === "5433";
  const isExpectedDb = database === "ljd_dev";

  if (isNeonLike) {
    return {
      ok: false,
      host,
      port,
      database,
      isLocalLoopback,
      isNeonLike: true,
      reason: "neon_forbidden",
    };
  }
  if (!isLocalLoopback || !isExpectedDevPort || !isExpectedDb) {
    return {
      ok: false,
      host,
      port,
      database,
      isLocalLoopback,
      isNeonLike: false,
      reason: "not_disposable_ljd_dev_5433",
    };
  }
  return {
    ok: true,
    host,
    port,
    database,
    isLocalLoopback: true,
    isNeonLike: false,
    reason: "ok_local_ljd_dev",
  };
}

export function assertLocalDisposableDatabaseUrl(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): LocalDisposableDbAudit {
  const audit = auditDatabaseUrlForNonprodIdempotency(databaseUrl);
  if (!audit.ok) {
    throw new Error(`nonprod_db_gate_failed:${audit.reason}`);
  }
  return audit;
}

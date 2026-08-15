/**
 * Local Runtime E2E harness gates (AI-5.2).
 * All must pass before auth bridge or fault control may run.
 * Never logs secrets or cookie values.
 */

import {
  auditDatabaseUrlForNonprodIdempotency,
  type LocalDisposableDbAudit,
} from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

export const LJD_ENABLE_LOCAL_E2E_HARNESS = "LJD_ENABLE_LOCAL_E2E_HARNESS" as const;
export const LJD_LOCAL_E2E_ACTOR_EMAIL = "LJD_LOCAL_E2E_ACTOR_EMAIL" as const;

export type LocalE2eHarnessGateInput = {
  nodeEnv?: string | undefined;
  enableFlag?: string | undefined;
  actorEmail?: string | undefined;
  requestHost?: string | null | undefined;
  databaseUrl?: string | undefined;
};

export type LocalE2eHarnessGateResult = {
  ok: boolean;
  reason: string;
  actorEmail: string | null;
  db: LocalDisposableDbAudit;
  hostOk: boolean;
  nodeEnvOk: boolean;
  flagOk: boolean;
  actorOk: boolean;
};

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const bare = host.trim().toLowerCase().split(":")[0] ?? "";
  return bare || null;
}

export function isLocalLoopbackHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  return h === "127.0.0.1" || h === "localhost";
}

export function resolveLocalE2eActorEmail(
  actorEmail: string | undefined = process.env[LJD_LOCAL_E2E_ACTOR_EMAIL],
): string | null {
  const email = (actorEmail ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

export function evaluateLocalE2eHarnessGate(
  input: LocalE2eHarnessGateInput = {},
): LocalE2eHarnessGateResult {
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV ?? "";
  const enableFlag = (input.enableFlag ?? process.env[LJD_ENABLE_LOCAL_E2E_HARNESS] ?? "").trim();
  const actorEmail = resolveLocalE2eActorEmail(input.actorEmail);
  const db = auditDatabaseUrlForNonprodIdempotency(input.databaseUrl ?? process.env.DATABASE_URL);
  const hostOk = isLocalLoopbackHost(input.requestHost);
  const nodeEnvOk = nodeEnv !== "production";
  const flagOk = enableFlag === "YES";
  const actorOk = actorEmail != null;

  if (!nodeEnvOk) {
    return {
      ok: false,
      reason: "node_env_production",
      actorEmail,
      db,
      hostOk,
      nodeEnvOk,
      flagOk,
      actorOk,
    };
  }
  if (!flagOk) {
    return {
      ok: false,
      reason: "harness_flag_missing",
      actorEmail,
      db,
      hostOk,
      nodeEnvOk,
      flagOk,
      actorOk,
    };
  }
  if (!hostOk) {
    return {
      ok: false,
      reason: "request_host_not_loopback",
      actorEmail,
      db,
      hostOk,
      nodeEnvOk,
      flagOk,
      actorOk,
    };
  }
  if (!db.ok) {
    return {
      ok: false,
      reason: `db_gate:${db.reason}`,
      actorEmail,
      db,
      hostOk,
      nodeEnvOk,
      flagOk,
      actorOk,
    };
  }
  if (!actorOk) {
    return {
      ok: false,
      reason: "actor_email_unset",
      actorEmail,
      db,
      hostOk,
      nodeEnvOk,
      flagOk,
      actorOk,
    };
  }
  return {
    ok: true,
    reason: "ok_local_e2e_harness",
    actorEmail,
    db,
    hostOk,
    nodeEnvOk,
    flagOk,
    actorOk,
  };
}

/** Request host for Next route handlers (no secrets). */
export function requestHostFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return headers.get("host");
}

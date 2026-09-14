/**
 * Temporary AccountSettings write observability (AI-X6).
 *
 * Gate: LJD_ACCOUNTSETTINGS_WRITE_TRACE=YES|1 (default OFF)
 * Salt: LJD_ACCOUNTSETTINGS_WRITE_TRACE_SALT (required for any PII-derived hash)
 *
 * Never logs raw email / UID / FRN / names / cookies / tokens / secrets / SQL binds.
 * Trace failures must never fail the primary AccountSettings write.
 */

import { createHash } from "crypto";

export const ACCOUNTSETTINGS_WRITE_TRACE_FLAG =
  "LJD_ACCOUNTSETTINGS_WRITE_TRACE" as const;
export const ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG =
  "LJD_ACCOUNTSETTINGS_WRITE_TRACE_SALT" as const;

export type AccountSettingsWriteOp =
  | "create"
  | "update"
  | "upsert"
  | "updateMany"
  | "delete"
  | "deleteMany"
  | "raw_insert"
  | "raw_update";

export type AccountSettingsSelectorType =
  | "id"
  | "email"
  | "identityId"
  | "stripeCustomerId"
  | "memberNumber_null_scan"
  | "normalized_email_dup"
  | "compound"
  | "unknown";

export type AccountSettingsActorType =
  | "lj_user_email"
  | "verified_uid"
  | "admin_operator"
  | "stripe_webhook"
  | "system"
  | "unknown";

export type AccountSettingsWriteTraceEvent = {
  event: "account_settings_write";
  ts: string;
  deploymentSha: string | null;
  operation: AccountSettingsWriteOp;
  callsite: string;
  sourceHint: string | null;
  selectorType: AccountSettingsSelectorType;
  selectorHash: string | null;
  actorType: AccountSettingsActorType;
  actorHash: string | null;
  targetIdHash: string | null;
  targetEmailHash: string | null;
  changedFields: string[];
  reason: string | null;
  correlationId: string | null;
  route: string | null;
};

export type AccountSettingsWriteTraceInput = {
  operation: AccountSettingsWriteOp;
  callsite: string;
  sourceHint?: string | null;
  selectorType: AccountSettingsSelectorType;
  /** Raw selector value — hashed only when salt is present; never logged. */
  selectorValue?: string | null;
  actorType?: AccountSettingsActorType;
  /** Raw actor identifier — hashed only when salt is present; never logged. */
  actorValue?: string | null;
  targetId?: string | null;
  targetEmail?: string | null;
  changedFields?: string[];
  reason?: string | null;
  correlationId?: string | null;
  route?: string | null;
};

export type AccountSettingsWriteTraceDeps = {
  env?: NodeJS.ProcessEnv;
  log?: (event: AccountSettingsWriteTraceEvent) => void;
  now?: () => Date;
};

let missingSaltWarned = false;

export function isAccountSettingsWriteTraceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const v = (env[ACCOUNTSETTINGS_WRITE_TRACE_FLAG] ?? "").trim();
  return v === "YES" || v === "1";
}

export function getAccountSettingsWriteTraceSalt(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const salt = (env[ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG] ?? "").trim();
  return salt.length > 0 ? salt : null;
}

/** Test-only: reset one-shot missing-salt warning. */
export function resetAccountSettingsWriteTraceWarningForTests(): void {
  missingSaltWarned = false;
}

export function hashAccountSettingsTraceValue(
  type: string,
  value: string,
  salt: string,
): string {
  const normalized = value.trim().toLowerCase();
  return createHash("sha256")
    .update(`${salt}|${type}|${normalized}`, "utf8")
    .digest("hex");
}

function safeHash(
  type: string,
  value: string | null | undefined,
  salt: string | null,
): string | null {
  if (!salt || value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return hashAccountSettingsTraceValue(type, trimmed, salt);
}

function warnMissingSaltOnce(logWarn: (msg: string) => void): void {
  if (missingSaltWarned) return;
  missingSaltWarned = true;
  logWarn(
    "[account_settings_write_trace] enabled but LJD_ACCOUNTSETTINGS_WRITE_TRACE_SALT is missing; emitting event without PII hashes",
  );
}

/**
 * Classify Prisma `where` without logging values.
 */
export function classifyAccountSettingsWhere(
  where: unknown,
): { selectorType: AccountSettingsSelectorType; selectorValue: string | null } {
  if (!where || typeof where !== "object" || Array.isArray(where)) {
    return { selectorType: "unknown", selectorValue: null };
  }
  const w = where as Record<string, unknown>;
  const keys = Object.keys(w).filter((k) => w[k] !== undefined);
  if (keys.length === 0) {
    return { selectorType: "unknown", selectorValue: null };
  }

  const pickString = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && "equals" in (v as object)) {
      const eq = (v as { equals?: unknown }).equals;
      return typeof eq === "string" ? eq : null;
    }
    return null;
  };

  if (keys.length === 1) {
    const key = keys[0]!;
    if (key === "id") {
      return { selectorType: "id", selectorValue: pickString(w.id) };
    }
    if (key === "email") {
      return { selectorType: "email", selectorValue: pickString(w.email) };
    }
    if (key === "identityId") {
      return {
        selectorType: "identityId",
        selectorValue: pickString(w.identityId),
      };
    }
    if (key === "stripeCustomerId") {
      return {
        selectorType: "stripeCustomerId",
        selectorValue: pickString(w.stripeCustomerId),
      };
    }
  }

  if (
    keys.includes("memberNumber") &&
    w.memberNumber &&
    typeof w.memberNumber === "object" &&
    (w.memberNumber as { equals?: unknown }).equals === null
  ) {
    return { selectorType: "memberNumber_null_scan", selectorValue: null };
  }

  if (keys.length > 1) {
    return { selectorType: "compound", selectorValue: null };
  }

  return { selectorType: "unknown", selectorValue: null };
}

/** Field names only from Prisma data objects (never values). */
export function extractChangedFieldNames(data: unknown): string[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.keys(data as Record<string, unknown>).sort();
}

export function extractChangedFieldsFromPrismaArgs(
  operation: AccountSettingsWriteOp,
  args: { data?: unknown; create?: unknown; update?: unknown },
): string[] {
  const fields = new Set<string>();
  if (operation === "create" && args.data) {
    for (const k of extractChangedFieldNames(args.data)) fields.add(k);
  }
  if (operation === "update" && args.data) {
    for (const k of extractChangedFieldNames(args.data)) fields.add(k);
    fields.add("updatedAt(auto)");
  }
  if (operation === "upsert") {
    for (const k of extractChangedFieldNames(args.create)) fields.add(k);
    for (const k of extractChangedFieldNames(args.update)) fields.add(k);
    fields.add("updatedAt(auto)");
  }
  if (operation === "updateMany" && args.data) {
    for (const k of extractChangedFieldNames(args.data)) fields.add(k);
    fields.add("updatedAt(auto)");
  }
  if (operation === "delete" || operation === "deleteMany") {
    fields.add("(delete)");
  }
  return [...fields].sort();
}

/**
 * Best-effort repo-relative stack hint. Never includes args or user input.
 */
export function extractSourceHintFromStack(stack?: string): string | null {
  const text = stack ?? new Error().stack ?? "";
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.includes("/src/")) continue;
    if (line.includes("accountSettingsWriteTrace")) continue;
    if (line.includes("node_modules")) continue;
    const m = line.match(/(\/src\/[^\s:)]+)/);
    if (!m?.[1]) continue;
    const path = m[1].replace(/^.*(\/src\/)/, "src/");
    return path.slice(0, 200);
  }
  return null;
}

function defaultLog(event: AccountSettingsWriteTraceEvent): void {
  console.info(JSON.stringify(event));
}

/**
 * Emit one structured AccountSettings write event. Never throws to callers.
 */
export function emitAccountSettingsWriteTrace(
  input: AccountSettingsWriteTraceInput,
  deps: AccountSettingsWriteTraceDeps = {},
): void {
  try {
    const env = deps.env ?? process.env;
    if (!isAccountSettingsWriteTraceEnabled(env)) return;

    const salt = getAccountSettingsWriteTraceSalt(env);
    if (!salt) {
      warnMissingSaltOnce((msg) => {
        try {
          console.warn(msg);
        } catch {
          /* ignore */
        }
      });
    }

    const log = deps.log ?? defaultLog;
    const now = deps.now ?? (() => new Date());
    const deploymentSha =
      (env.VERCEL_GIT_COMMIT_SHA ?? env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "")
        .trim() || null;

    const event: AccountSettingsWriteTraceEvent = {
      event: "account_settings_write",
      ts: now().toISOString(),
      deploymentSha,
      operation: input.operation,
      callsite: input.callsite,
      sourceHint: input.sourceHint ?? null,
      selectorType: input.selectorType,
      selectorHash: salt
        ? safeHash("selector", input.selectorValue, salt)
        : null,
      actorType: input.actorType ?? "unknown",
      actorHash: salt ? safeHash("actor", input.actorValue, salt) : null,
      targetIdHash: salt ? safeHash("id", input.targetId, salt) : null,
      targetEmailHash: salt ? safeHash("email", input.targetEmail, salt) : null,
      changedFields: [...(input.changedFields ?? [])],
      reason: input.reason ?? null,
      correlationId: input.correlationId ?? null,
      route: input.route ?? null,
    };

    log(event);
  } catch {
    try {
      console.warn("[account_settings_write_trace] emit failed");
    } catch {
      /* ignore */
    }
  }
}

/**
 * Trace a Prisma accountSettings write from extension args (no extra DB reads).
 */
export function tracePrismaAccountSettingsWrite(input: {
  operation: Exclude<
    AccountSettingsWriteOp,
    "raw_insert" | "raw_update"
  >;
  args: {
    where?: unknown;
    data?: unknown;
    create?: unknown;
    update?: unknown;
  };
  deps?: AccountSettingsWriteTraceDeps;
}): void {
  try {
    const { selectorType, selectorValue } = classifyAccountSettingsWhere(
      input.args.where,
    );
    let targetId: string | null = null;
    let targetEmail: string | null = null;
    if (selectorType === "id") targetId = selectorValue;
    if (selectorType === "email") targetEmail = selectorValue;

    // create may carry email/id in data
    if (input.operation === "create" && input.args.data && typeof input.args.data === "object") {
      const d = input.args.data as Record<string, unknown>;
      if (typeof d.id === "string") targetId = d.id;
      if (typeof d.email === "string") targetEmail = d.email;
    }
    if (input.operation === "upsert" && input.args.create && typeof input.args.create === "object") {
      const d = input.args.create as Record<string, unknown>;
      if (typeof d.email === "string" && !targetEmail) targetEmail = d.email;
    }

    emitAccountSettingsWriteTrace(
      {
        operation: input.operation,
        callsite: `prisma.accountSettings.${input.operation}`,
        sourceHint: extractSourceHintFromStack(),
        selectorType:
          input.operation === "create" && !input.args.where
            ? typeof (input.args.data as { email?: unknown } | undefined)?.email ===
              "string"
              ? "email"
              : "unknown"
            : selectorType,
        selectorValue:
          input.operation === "create" && !selectorValue
            ? typeof (input.args.data as { email?: unknown } | undefined)?.email ===
              "string"
              ? String((input.args.data as { email: string }).email)
              : null
            : selectorValue,
        targetId,
        targetEmail,
        changedFields: extractChangedFieldsFromPrismaArgs(input.operation, input.args),
        actorType: "unknown",
        reason: null,
      },
      input.deps,
    );
  } catch {
    try {
      console.warn("[account_settings_write_trace] prisma trace failed");
    } catch {
      /* ignore */
    }
  }
}

/**
 * Explicit trace for admin raw SQL AccountSettings writes (no bind values).
 */
export function traceAdminRawAccountSettingsWrite(input: {
  operation: "raw_insert" | "raw_update";
  reason: string;
  selectorType: AccountSettingsSelectorType;
  selectorValue?: string | null;
  targetId?: string | null;
  targetEmail?: string | null;
  changedFields: string[];
  deps?: AccountSettingsWriteTraceDeps;
}): void {
  emitAccountSettingsWriteTrace(
    {
      operation: input.operation,
      callsite: "admin.actions.accountSettingsRaw",
      sourceHint: "src/app/admin/actions.ts",
      selectorType: input.selectorType,
      selectorValue: input.selectorValue,
      targetId: input.targetId,
      targetEmail: input.targetEmail,
      changedFields: input.changedFields,
      actorType: "admin_operator",
      reason: input.reason,
    },
    input.deps,
  );
}

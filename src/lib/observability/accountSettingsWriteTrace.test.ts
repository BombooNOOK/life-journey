import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCOUNTSETTINGS_WRITE_TRACE_FLAG,
  ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG,
  classifyAccountSettingsWhere,
  emitAccountSettingsWriteTrace,
  extractChangedFieldsFromPrismaArgs,
  hashAccountSettingsTraceValue,
  isAccountSettingsWriteTraceEnabled,
  resetAccountSettingsWriteTraceWarningForTests,
  traceAdminRawAccountSettingsWrite,
  tracePrismaAccountSettingsWrite,
  type AccountSettingsWriteTraceEvent,
} from "@/lib/observability/accountSettingsWriteTrace";

const SECRET_EMAIL = "secret.user@example.com";
const SECRET_UID = "firebaseUidSecretValue123";
const SECRET_FRN = "BN-999888777";
const SECRET_NAME = "秘密の表示名";

describe("accountSettingsWriteTrace", () => {
  const events: AccountSettingsWriteTraceEvent[] = [];
  const warns: string[] = [];

  beforeEach(() => {
    events.length = 0;
    warns.length = 0;
    resetAccountSettingsWriteTraceWarningForTests();
    vi.spyOn(console, "warn").mockImplementation((msg: unknown) => {
      warns.push(String(msg));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function captureDeps(env: NodeJS.ProcessEnv) {
    return {
      env,
      log: (e: AccountSettingsWriteTraceEvent) => {
        events.push(e);
      },
      now: () => new Date("2026-09-14T12:00:00.000Z"),
    };
  }

  it("A: gate OFF → no events", () => {
    expect(isAccountSettingsWriteTraceEnabled({})).toBe(false);
    emitAccountSettingsWriteTrace(
      {
        operation: "update",
        callsite: "test",
        selectorType: "email",
        selectorValue: SECRET_EMAIL,
        changedFields: ["readingFontSize"],
      },
      captureDeps({}),
    );
    expect(events).toHaveLength(0);
  });

  it("B: gate ON + salt → one structured event", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    emitAccountSettingsWriteTrace(
      {
        operation: "update",
        callsite: "prisma.accountSettings.update",
        selectorType: "email",
        selectorValue: SECRET_EMAIL,
        targetEmail: SECRET_EMAIL,
        changedFields: ["readingFontSize", "updatedAt(auto)"],
        reason: "unit",
      },
      captureDeps(env),
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.event).toBe("account_settings_write");
    expect(events[0]!.operation).toBe("update");
    expect(events[0]!.selectorHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("C: email selector never logs raw email", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "1",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    emitAccountSettingsWriteTrace(
      {
        operation: "upsert",
        callsite: "test",
        selectorType: "email",
        selectorValue: SECRET_EMAIL,
        targetEmail: SECRET_EMAIL,
        changedFields: ["readingFontSize"],
      },
      captureDeps(env),
    );
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(SECRET_EMAIL);
    expect(dumped).not.toContain("secret.user");
  });

  it("D: UID / FRN / name raw values never appear in log", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    emitAccountSettingsWriteTrace(
      {
        operation: "update",
        callsite: "test",
        selectorType: "id",
        selectorValue: "settings-id-1",
        actorType: "verified_uid",
        actorValue: SECRET_UID,
        targetId: "settings-id-1",
        changedFields: ["forestResidentDisplayName"],
        reason: "unit_display_name_update",
      },
      captureDeps(env),
    );
    // Assert hashes don't leak UID when used as actor; FRN/name never logged as raw.
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(SECRET_UID);
    expect(dumped).not.toContain(SECRET_FRN);
    expect(dumped).not.toContain(SECRET_NAME);
    expect(events[0]!.actorHash).toBe(
      hashAccountSettingsTraceValue("actor", SECRET_UID, "dummy-test-salt"),
    );
  });

  it("E: changedFields are names only", () => {
    const fields = extractChangedFieldsFromPrismaArgs("update", {
      data: { readingFontSize: "large", identityId: "should-not-appear-as-value" },
    });
    expect(fields).toContain("readingFontSize");
    expect(fields).toContain("identityId");
    expect(fields).toContain("updatedAt(auto)");
    expect(fields.join(",")).not.toContain("large");
    expect(fields.join(",")).not.toContain("should-not-appear");
  });

  it("F: throw inside log sink does not escape emit", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    expect(() =>
      emitAccountSettingsWriteTrace(
        {
          operation: "update",
          callsite: "test",
          selectorType: "email",
          selectorValue: SECRET_EMAIL,
          changedFields: ["readingFontSize"],
        },
        {
          env,
          log: () => {
            throw new Error(`boom ${SECRET_EMAIL}`);
          },
        },
      ),
    ).not.toThrow();
  });

  it("G: raw admin trace never includes SQL bind / email", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    traceAdminRawAccountSettingsWrite({
      operation: "raw_update",
      reason: "admin_sync_duplicate_profile_limit",
      selectorType: "normalized_email_dup",
      selectorValue: SECRET_EMAIL,
      targetEmail: SECRET_EMAIL,
      changedFields: ["profileLimit"],
      deps: captureDeps(env),
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.operation).toBe("raw_update");
    expect(events[0]!.callsite).toBe("admin.actions.accountSettingsRaw");
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(SECRET_EMAIL);
    expect(dumped).not.toContain("UPDATE \"AccountSettings\"");
    expect(dumped).not.toContain("EXCLUDED");
  });

  it("H: all ORM ops are classifiable via tracePrismaAccountSettingsWrite", () => {
    const env = {
      [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES",
      [ACCOUNTSETTINGS_WRITE_TRACE_SALT_FLAG]: "dummy-test-salt",
    };
    const ops = [
      "create",
      "update",
      "upsert",
      "updateMany",
      "delete",
      "deleteMany",
    ] as const;
    for (const op of ops) {
      tracePrismaAccountSettingsWrite({
        operation: op,
        args:
          op === "create"
            ? { data: { email: SECRET_EMAIL, readingFontSize: "normal" } }
            : op === "upsert"
              ? {
                  where: { email: SECRET_EMAIL },
                  create: { email: SECRET_EMAIL, readingFontSize: "normal" },
                  update: { readingFontSize: "large" },
                }
              : op === "delete" || op === "deleteMany"
                ? { where: { id: "abc" } }
                : {
                    where: { email: SECRET_EMAIL },
                    data: { readingFontSize: "normal" },
                  },
        deps: captureDeps(env),
      });
    }
    expect(events).toHaveLength(ops.length);
    expect(events.map((e) => e.operation).sort()).toEqual([...ops].sort());
    const dumped = JSON.stringify(events);
    expect(dumped).not.toContain(SECRET_EMAIL);
  });

  it("missing salt: still emits without hashes and warns once", () => {
    const env = { [ACCOUNTSETTINGS_WRITE_TRACE_FLAG]: "YES" };
    emitAccountSettingsWriteTrace(
      {
        operation: "update",
        callsite: "test",
        selectorType: "email",
        selectorValue: SECRET_EMAIL,
        targetEmail: SECRET_EMAIL,
        changedFields: ["readingFontSize"],
      },
      captureDeps(env),
    );
    emitAccountSettingsWriteTrace(
      {
        operation: "update",
        callsite: "test",
        selectorType: "email",
        selectorValue: SECRET_EMAIL,
        changedFields: ["readingFontSize"],
      },
      captureDeps(env),
    );
    expect(events).toHaveLength(2);
    expect(events[0]!.selectorHash).toBeNull();
    expect(events[0]!.targetEmailHash).toBeNull();
    expect(warns.filter((w) => w.includes("SALT is missing"))).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain(SECRET_EMAIL);
  });

  it("classifyAccountSettingsWhere covers common selectors", () => {
    expect(classifyAccountSettingsWhere({ email: SECRET_EMAIL })).toEqual({
      selectorType: "email",
      selectorValue: SECRET_EMAIL,
    });
    expect(classifyAccountSettingsWhere({ id: "x1" }).selectorType).toBe("id");
    expect(classifyAccountSettingsWhere({ identityId: "i1" }).selectorType).toBe(
      "identityId",
    );
    expect(
      classifyAccountSettingsWhere({ stripeCustomerId: "cus_1" }).selectorType,
    ).toBe("stripeCustomerId");
    expect(
      classifyAccountSettingsWhere({ memberNumber: { equals: null } }).selectorType,
    ).toBe("memberNumber_null_scan");
    expect(
      classifyAccountSettingsWhere({ email: SECRET_EMAIL, isAdmin: true }).selectorType,
    ).toBe("compound");
  });
});

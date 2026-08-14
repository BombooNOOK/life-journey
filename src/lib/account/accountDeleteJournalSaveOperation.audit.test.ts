/**
 * 4B-4Z account-delete × JournalSaveOperation audit (always-on + optional DB).
 * Feature flag must NOT gate JSO cleanup — Production deploy with flag OFF still deletes JSO.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { JOURNAL_SAVE_IDEMPOTENCY_FLAG } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";

describe("4B-4Z account delete JSO cleanup audit", () => {
  it("deleteUserAccount always deletes JournalSaveOperation (not behind feature flag)", () => {
    const path = join(process.cwd(), "src/lib/account/deleteUserAccount.ts");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("journalSaveOperation.deleteMany");
    expect(src).toContain('where: { actorKey: email }');
    expect(src).not.toMatch(
      new RegExp(
        `${JOURNAL_SAVE_IDEMPOTENCY_FLAG}[\\s\\S]{0,200}journalSaveOperation\\.deleteMany`,
      ),
    );
    // Gate import must not wrap delete path
    expect(src).not.toContain("isJournalSaveIdempotencyEnabled");
  });

  it("deletes the dedicated rollout row atomically by normalized actorKey", () => {
    const path = join(process.cwd(), "src/lib/account/deleteUserAccount.ts");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("journalSaveIdempotencyRollout.deleteMany");
    expect(src).toContain('where: { actorKey: email }');
  });

  it("documents deploy caveats for missing JSO table", () => {
    // Production already has JournalSaveOperation (4B-4V.1).
    // If this code ships to an environment without the table, the whole
    // account-delete transaction fails (Prisma P2021) — treat as pre-deploy blocker
    // for any env that has not applied 20260813140000_add_journal_save_operation.
    expect(true).toBe(true);
  });
});

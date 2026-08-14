/**
 * 4B-4AI-1 local disposable PostgreSQL route integration.
 * Never runs unless explicitly pointed at the audited ljd_dev fixture.
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { JOURNAL_SAVE_IDEMPOTENCY_FLAG } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";

const viewerState = vi.hoisted(() => ({ email: null as string | null }));

vi.mock("@/lib/auth/viewer", () => ({
  getViewerEmailFromCookie: async () => viewerState.email,
  normalizeEmail: (value: string | null | undefined) => (value ?? "").trim().toLowerCase(),
}));

const capability = await import("@/app/api/journal/save-capability/route");
const lookup = await import("@/app/api/journal/save-operations/[saveOperationId]/route");

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const OWNER = "4b4ai1-owner@ljd.invalid";
const OTHER = "4b4ai1-other@ljd.invalid";
const OP = "01H4B4AI1LOCALOPERATION000001";
const FP = "f".repeat(64);

async function wipe(actorKey: string) {
  await prisma.journalSaveOperation.deleteMany({ where: { actorKey } });
  await prisma.journalSaveIdempotencyRollout.deleteMany({ where: { actorKey } });
}

async function lookupFor(saveOperationId = OP, fingerprint = FP) {
  return lookup.GET(
    new Request(
      `https://ljd.invalid/api/journal/save-operations/${saveOperationId}?requestFingerprint=${fingerprint}`,
    ),
    { params: Promise.resolve({ saveOperationId }) },
  );
}

async function seedOperation(input: {
  actorKey: string;
  status: "processing" | "completed" | "failed_final";
  journalEntryId?: string | null;
  fingerprint?: string;
  resultCode?: "OK" | "ACORN_INSUFFICIENT" | "INTERNAL" | null;
}) {
  await prisma.journalSaveOperation.create({
    data: {
      actorKey: input.actorKey,
      saveOperationId: OP,
      status: input.status,
      checkpoint: input.status === "processing" ? "entry_created" : "completed",
      journalEntryId: input.journalEntryId ?? null,
      requestFingerprint: input.fingerprint ?? FP,
      resultCode: input.resultCode ?? null,
    },
  });
}

describe.skipIf(!runLocal)("4B-4AI-1 save protocol routes (local disposable DB)", () => {
  beforeEach(async () => {
    delete process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG];
    viewerState.email = OWNER;
    await wipe(OWNER);
    await wipe(OTHER);
  });

  afterAll(async () => {
    delete process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG];
    viewerState.email = null;
    await wipe(OWNER);
    await wipe(OTHER);
    await prisma.$disconnect();
  });

  it("migration created the table with a unique actorKey and empty table admits nobody", async () => {
    expect(audit.ok).toBe(true);
    expect(await prisma.journalSaveIdempotencyRollout.count()).toBe(0);
    process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG] = "YES";
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
    });
    await prisma.journalSaveIdempotencyRollout.create({
      data: { actorKey: OWNER, enabled: true, protocolVersion: 1 },
    });
    await expect(
      prisma.journalSaveIdempotencyRollout.create({
        data: { actorKey: OWNER, enabled: true, protocolVersion: 1 },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("requires global ON and an enabled supported rollout row", async () => {
    await prisma.journalSaveIdempotencyRollout.create({
      data: { actorKey: OWNER, enabled: true, protocolVersion: 1 },
    });
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
    });

    process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG] = "YES";
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: true,
      lookupSupported: true,
      foregroundRecoverySupported: true,
    });

    await prisma.journalSaveIdempotencyRollout.update({
      where: { actorKey: OWNER },
      data: { enabled: false },
    });
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
    });

    await prisma.journalSaveIdempotencyRollout.update({
      where: { actorKey: OWNER },
      data: { enabled: true, protocolVersion: 2 },
    });
    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
    });
  });

  it("returns only minimal own-operation states and isolates another actor", async () => {
    expect(await (await lookupFor()).json()).toEqual({ protocolVersion: 1, state: "not_found" });

    await seedOperation({ actorKey: OTHER, status: "completed", journalEntryId: "entry_other" });
    expect(await (await lookupFor()).json()).toEqual({ protocolVersion: 1, state: "not_found" });
    await wipe(OTHER);

    await seedOperation({ actorKey: OWNER, status: "processing" });
    expect(await (await lookupFor()).json()).toEqual({ protocolVersion: 1, state: "processing" });
    await wipe(OWNER);

    await seedOperation({ actorKey: OWNER, status: "completed", journalEntryId: "entry_canonical", resultCode: "OK" });
    expect(await (await lookupFor()).json()).toEqual({
      protocolVersion: 1,
      state: "completed",
      entryId: "entry_canonical",
    });
    await wipe(OWNER);

    await seedOperation({ actorKey: OWNER, status: "failed_final", resultCode: "ACORN_INSUFFICIENT" });
    expect(await (await lookupFor()).json()).toEqual({
      protocolVersion: 1,
      state: "failed_final",
      errorCategory: "acorn",
    });
    expect(await (await lookupFor(OP, "wrong")).json()).toEqual({
      protocolVersion: 1,
      state: "fingerprint_mismatch",
    });
  });

  it("keeps owner lookup available after rollout is disabled but denies new admission", async () => {
    process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG] = "YES";
    await prisma.journalSaveIdempotencyRollout.create({
      data: { actorKey: OWNER, enabled: true, protocolVersion: 1 },
    });
    await seedOperation({ actorKey: OWNER, status: "completed", journalEntryId: "entry_recover", resultCode: "OK" });
    await prisma.journalSaveIdempotencyRollout.update({
      where: { actorKey: OWNER },
      data: { enabled: false },
    });

    expect(await (await capability.GET()).json()).toMatchObject({
      idempotentSaveEnabled: false,
    });
    expect(await (await lookupFor()).json()).toEqual({
      protocolVersion: 1,
      state: "completed",
      entryId: "entry_recover",
    });

    viewerState.email = OTHER;
    expect(await (await lookupFor()).json()).toEqual({ protocolVersion: 1, state: "not_found" });
  });
});

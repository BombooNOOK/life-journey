/**
 * 4B-4Z｜Journal POST Route-Level Idempotency E2E
 *
 * Real path: cookie → POST /api/journal → JSO → JournalEntry → photo → donguri → HTTP
 * Hard gate: local disposable Postgres only (127.0.0.1:5433/ljd_dev). Never Neon/Production.
 *
 * Run:
 *   RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/app/api/journal/journalPostRouteIdempotency.e2e.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_DELETE_CONFIRMATION_WORD } from "@/lib/account/accountDeleteTypes";
import { deleteUserAccount } from "@/lib/account/deleteUserAccount";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { JOURNAL_SAVE_IDEMPOTENCY_FLAG } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";
import { buildProductionJournalSaveFingerprint } from "@/lib/journal/saveIdempotency/productionRequestFingerprint";
import { DONGURI_DIARY_SAVE_COST } from "@/lib/loghouse/donguriTypes";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runE2e = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const ACTOR_A = "4b4z-a@ljd.invalid";
const ACTOR_B = "4b4z-b@ljd.invalid";
const ACTOR_OFF = "4b4z-off@ljd.invalid";
const ACTOR_INSUF = "4b4z-insuf@ljd.invalid";
const ACTOR_PHOTO = "4b4z-photo@ljd.invalid";
const ACTOR_DEL = "4b4z-del@ljd.invalid";
const ACTOR_RESUME = "4b4z-resume@ljd.invalid";
const ACTOR_LEGACY = "4b4z-legacy-insuf@ljd.invalid";

const ALL_ACTORS = [
  ACTOR_A,
  ACTOR_B,
  ACTOR_OFF,
  ACTOR_INSUF,
  ACTOR_PHOTO,
  ACTOR_DEL,
  ACTOR_RESUME,
  ACTOR_LEGACY,
] as const;

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const viewerState = vi.hoisted(() => ({ email: "" as string }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name !== "lj_user_email") return undefined;
      if (!viewerState.email) return undefined;
      return { value: encodeURIComponent(viewerState.email) };
    },
  }),
}));

const { POST } = await import("@/app/api/journal/route");

function setIdempotencyFlag(on: boolean) {
  if (on) {
    process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG] = "YES";
  } else {
    delete process.env[JOURNAL_SAVE_IDEMPOTENCY_FLAG];
  }
}

function newOp(tag: string): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  const hex = [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `01HX4B4Z${tag}${hex}`.slice(0, 26);
}

async function cleanupActors() {
  for (const email of ALL_ACTORS) {
    await prisma.journalSaveOperation.deleteMany({ where: { actorKey: email } });
    await prisma.logHouseDonguriLedgerEntry.deleteMany({ where: { email } });
    await prisma.journalDraft.deleteMany({ where: { email } });
    await prisma.journalEntry.deleteMany({ where: { email } });
    await prisma.profile.deleteMany({ where: { email } });
    await prisma.accountSettings.deleteMany({ where: { email } });
  }
}

async function seedActor(params: {
  email: string;
  donguri?: number;
  nickname?: string;
}): Promise<{ profileId: string }> {
  const email = params.email;
  await prisma.accountSettings.upsert({
    where: { email },
    create: {
      email,
      isAdmin: false,
      isMonitor: true,
      profileLimit: 3,
    },
    update: {
      isMonitor: true,
      profileLimit: 3,
    },
  });
  const profile = await prisma.profile.create({
    data: {
      email,
      nickname: params.nickname ?? `4b4z-${email.split("@")[0]}`,
    },
  });
  const amount = params.donguri ?? 30;
  if (amount !== 0) {
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email,
        profileId: profile.id,
        amount,
        reason: "admin_grant",
        title: "4B-4Z test grant",
        dateKey: `4b4z-grant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdBy: "admin",
      },
    });
  }
  return { profileId: profile.id };
}

function baseBody(profileId: string, overrides: Record<string, unknown> = {}) {
  return {
    content: "4B-4Z route e2e footprint",
    mood: "calm",
    activity: "record_anyway",
    companionType: "owl",
    designTheme: "simple_plain",
    contentFontMode: "standard",
    includeInBook: true,
    entryDate: "2026-08-13",
    profileId,
    ...overrides,
  };
}

async function postJournal(
  email: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  viewerState.email = email;
  const req = new Request("http://localhost/api/journal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}

async function countEntries(email: string) {
  return prisma.journalEntry.count({ where: { email } });
}

async function countJso(email: string) {
  return prisma.journalSaveOperation.count({ where: { actorKey: email } });
}

async function countDiarySaveCharges(email: string) {
  return prisma.logHouseDonguriLedgerEntry.count({
    where: { email, reason: "diary_save" },
  });
}

describe.skipIf(!runE2e)("4B-4Z Journal POST route idempotency E2E (local DB)", () => {
  beforeAll(async () => {
    expect(audit.ok).toBe(true);
    expect(audit.isNeonLike).toBe(false);
    // Prefer legacy photoDataUrl path — no Production / Vercel Blob.
    delete process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN;
    delete process.env.JOURNAL_PHOTO_BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.BLOB_STORE_ID;
    await prisma.$queryRaw`SELECT 1 FROM "JournalSaveOperation" LIMIT 1`;
    await cleanupActors();
  });

  beforeEach(async () => {
    await cleanupActors();
    setIdempotencyFlag(false);
    viewerState.email = "";
  });

  afterAll(async () => {
    await cleanupActors();
    setIdempotencyFlag(false);
    await prisma.$disconnect();
  });

  it("E2E1 feature OFF: legacy without/with saveOperationId; JSO=0", async () => {
    setIdempotencyFlag(false);
    const { profileId } = await seedActor({ email: ACTOR_OFF });
    const op = newOp("OFF");

    const without = await postJournal(ACTOR_OFF, baseBody(profileId));
    expect(without.status).toBe(200);
    expect(without.json.code).toBe("OK");
    expect(without.json.saveOperation).toBeUndefined();

    const withId = await postJournal(
      ACTOR_OFF,
      baseBody(profileId, {
        content: "4B-4Z flag off with id",
        saveOperationId: op,
        entryDate: "2026-08-12",
      }),
    );
    expect(withId.status).toBe(200);
    expect(withId.json.code).toBe("OK");
    expect(withId.json.saveOperation).toBeUndefined();

    expect(await countEntries(ACTOR_OFF)).toBe(2);
    expect(await countJso(ACTOR_OFF)).toBe(0);
    expect(await countDiarySaveCharges(ACTOR_OFF)).toBe(2);
  });

  it("E2E2 fresh save: 200, entry1, jso1, charge1, completed", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const op = newOp("FR");
    const res = await postJournal(
      ACTOR_A,
      baseBody(profileId, { saveOperationId: op }),
    );
    expect(res.status).toBe(200);
    expect(res.json.code).toBe("OK");
    const saveOp = res.json.saveOperation as {
      status: string;
      reused: boolean;
      saveOperationId: string;
    };
    expect(saveOp.status).toBe("completed");
    expect(saveOp.reused).toBe(false);
    expect(saveOp.saveOperationId).toBe(op);
    const entry = res.json.entry as { id: string };
    expect(entry.id).toBeTruthy();

    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countJso(ACTOR_A)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(1);

    const row = await prisma.journalSaveOperation.findUnique({
      where: {
        actorKey_saveOperationId: { actorKey: ACTOR_A, saveOperationId: op },
      },
    });
    expect(row?.status).toBe("completed");
    expect(row?.checkpoint).toBe("completed");
    expect(row?.journalEntryId).toBe(entry.id);
  });

  it("E2E3 same retry: reused=true, no new entry/jso/charge", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const op = newOp("RT");
    const body = baseBody(profileId, { saveOperationId: op });
    const first = await postJournal(ACTOR_A, body);
    expect(first.status).toBe(200);
    const entryId = (first.json.entry as { id: string }).id;

    const second = await postJournal(ACTOR_A, body);
    expect(second.status).toBe(200);
    const saveOp = second.json.saveOperation as { reused: boolean };
    expect(saveOp.reused).toBe(true);
    expect((second.json.entry as { id: string }).id).toBe(entryId);

    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countJso(ACTOR_A)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(1);
  });

  it("E2E4 response-loss simulation: completed then retry same result", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const op = newOp("RL");
    const body = baseBody(profileId, {
      saveOperationId: op,
      content: "4B-4Z response loss",
    });
    const first = await postJournal(ACTOR_A, body);
    expect(first.status).toBe(200);
    // discard response (client never saw it)
    const retry = await postJournal(ACTOR_A, body);
    expect(retry.status).toBe(200);
    expect((retry.json.saveOperation as { reused: boolean }).reused).toBe(true);
    expect((retry.json.entry as { id: string }).id).toBe(
      (first.json.entry as { id: string }).id,
    );
    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(1);
  });

  it("E2E5 concurrent POST: converge to 1 entry / 1 jso / 1 charge", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const op = newOp("CC");
    const body = baseBody(profileId, {
      saveOperationId: op,
      content: "4B-4Z concurrent",
    });
    const results = await Promise.all([
      postJournal(ACTOR_A, body),
      postJournal(ACTOR_A, body),
      postJournal(ACTOR_A, body),
    ]);
    for (const r of results) {
      expect([200, 202]).toContain(r.status);
    }
    const completed = results.filter((r) => r.status === 200);
    expect(completed.length).toBeGreaterThanOrEqual(1);
    const ids = new Set(
      completed.map((r) => (r.json.entry as { id: string } | null)?.id).filter(Boolean),
    );
    expect(ids.size).toBe(1);

    // settle any 202 with one more retry
    const settle = await postJournal(ACTOR_A, body);
    expect(settle.status).toBe(200);

    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countJso(ACTOR_A)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(1);
  });

  it("E2E6 fingerprint mismatch: 409, no new entry/charge", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const op = newOp("FP");
    const first = await postJournal(
      ACTOR_A,
      baseBody(profileId, { saveOperationId: op, content: "original body" }),
    );
    expect(first.status).toBe(200);
    const entryId = (first.json.entry as { id: string }).id;

    const conflict = await postJournal(
      ACTOR_A,
      baseBody(profileId, { saveOperationId: op, content: "changed body" }),
    );
    expect(conflict.status).toBe(409);
    expect(conflict.json.code).toBe("SAVE_OPERATION_FINGERPRINT_MISMATCH");

    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countJso(ACTOR_A)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(1);
    const row = await prisma.journalSaveOperation.findUnique({
      where: {
        actorKey_saveOperationId: { actorKey: ACTOR_A, saveOperationId: op },
      },
    });
    expect(row?.journalEntryId).toBe(entryId);
    expect(row?.status).toBe("completed");
  });

  it("E2E7 invalid saveOperationId → 400, no side effects", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_A });
    const cases = [
      { saveOperationId: "short" },
      { saveOperationId: "x".repeat(65) },
      { saveOperationId: "!!!invalid!!!chars!!!" },
    ];
    for (const c of cases) {
      const res = await postJournal(ACTOR_A, baseBody(profileId, c));
      expect(res.status).toBe(400);
      expect(res.json.code).toBe("BAD_SAVE_OPERATION_ID");
    }
    expect(await countEntries(ACTOR_A)).toBe(0);
    expect(await countJso(ACTOR_A)).toBe(0);
    expect(await countDiarySaveCharges(ACTOR_A)).toBe(0);
  });

  it("E2E8 processing mid-checkpoint resume: no duplicate entry", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_RESUME });
    const op = newOp("PR");
    const content = "4B-4Z processing resume";
    const body = baseBody(profileId, { saveOperationId: op, content });
    const fingerprint = buildProductionJournalSaveFingerprint({
      content,
      entryDate: "2026-08-13",
      profileId,
      mood: "calm",
      activity: "record_anyway",
      companionType: "owl",
      designTheme: "simple_plain",
      contentFontMode: "standard",
      includeInBook: true,
      photoIdentity: "none",
    });

    const entry = await prisma.journalEntry.create({
      data: {
        email: ACTOR_RESUME,
        profileId,
        content,
        createdAt: new Date("2026-08-13T00:00:00.000Z"),
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple_plain",
        contentFontMode: "standard",
        includeInBook: true,
      },
    });
    await prisma.journalSaveOperation.create({
      data: {
        actorKey: ACTOR_RESUME,
        saveOperationId: op,
        status: "processing",
        checkpoint: "entry_created",
        journalEntryId: entry.id,
        requestFingerprint: fingerprint,
        resultCode: null,
      },
    });

    const res = await postJournal(ACTOR_RESUME, body);
    expect([200, 202]).toContain(res.status);
    if (res.status === 202) {
      const again = await postJournal(ACTOR_RESUME, body);
      expect(again.status).toBe(200);
    } else {
      expect(res.status).toBe(200);
    }

    expect(await countEntries(ACTOR_RESUME)).toBe(1);
    expect(await countJso(ACTOR_RESUME)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_RESUME)).toBe(1);
  });

  it("E2E9 failure checkpoints: resume without duplicate side effects", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_RESUME, donguri: 60 });

    async function resumeFrom(
      checkpoint: "entry_created" | "photo_completed" | "donguri_settled",
      tag: string,
    ) {
      const op = newOp(tag);
      const content = `4B-4Z resume ${checkpoint}`;
      const entryDate = "2026-08-11";
      const body = baseBody(profileId, {
        saveOperationId: op,
        content,
        entryDate,
      });
      const fingerprint = buildProductionJournalSaveFingerprint({
        content,
        entryDate,
        profileId,
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple_plain",
        contentFontMode: "standard",
        includeInBook: true,
        photoIdentity: "none",
      });
      const entry = await prisma.journalEntry.create({
        data: {
          email: ACTOR_RESUME,
          profileId,
          content,
          createdAt: new Date(`${entryDate}T00:00:00.000Z`),
          mood: "calm",
          activity: "record_anyway",
          companionType: "owl",
          designTheme: "simple_plain",
          contentFontMode: "standard",
          includeInBook: true,
        },
      });
      if (checkpoint === "donguri_settled") {
        await prisma.logHouseDonguriLedgerEntry.create({
          data: {
            email: ACTOR_RESUME,
            profileId,
            amount: -DONGURI_DIARY_SAVE_COST,
            reason: "diary_save",
            title: "今日のあしあと",
            dateKey: `entry:${entry.id}`,
            relatedDiaryId: entry.id,
            createdBy: "user",
          },
        });
      }
      await prisma.journalSaveOperation.create({
        data: {
          actorKey: ACTOR_RESUME,
          saveOperationId: op,
          status: "processing",
          checkpoint,
          journalEntryId: entry.id,
          requestFingerprint: fingerprint,
          resultCode: null,
        },
      });
      const beforeEntries = await countEntries(ACTOR_RESUME);
      const beforeCharges = await countDiarySaveCharges(ACTOR_RESUME);
      const res = await postJournal(ACTOR_RESUME, body);
      expect(res.status).toBe(200);
      expect((res.json.entry as { id: string }).id).toBe(entry.id);
      expect(await countEntries(ACTOR_RESUME)).toBe(beforeEntries);
      expect(await countDiarySaveCharges(ACTOR_RESUME)).toBe(
        checkpoint === "donguri_settled" ? beforeCharges : beforeCharges + 1,
      );
      const row = await prisma.journalSaveOperation.findUnique({
        where: {
          actorKey_saveOperationId: {
            actorKey: ACTOR_RESUME,
            saveOperationId: op,
          },
        },
      });
      expect(row?.status).toBe("completed");
      expect(row?.checkpoint).toBe("completed");
    }

    await resumeFrom("entry_created", "E1");
    await resumeFrom("photo_completed", "PH");
    await resumeFrom("donguri_settled", "DG");
  });

  it("E2E10 insufficient donguri on JSO path vs legacy", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_INSUF, donguri: 0 });
    const op = newOp("IN");
    const body = baseBody(profileId, {
      saveOperationId: op,
      content: "4B-4Z insufficient",
    });
    const res = await postJournal(ACTOR_INSUF, body);
    expect(res.status).toBe(402);
    expect(res.json.code).toBe("ACORN_INSUFFICIENT");
    expect(await countEntries(ACTOR_INSUF)).toBe(0);
    expect(await countDiarySaveCharges(ACTOR_INSUF)).toBe(0);
    const row = await prisma.journalSaveOperation.findUnique({
      where: {
        actorKey_saveOperationId: { actorKey: ACTOR_INSUF, saveOperationId: op },
      },
    });
    expect(row?.status).toBe("failed_final");
    expect(row?.resultCode).toBe("ACORN_INSUFFICIENT");
    expect(row?.journalEntryId).toBeNull();

    const retry = await postJournal(ACTOR_INSUF, body);
    expect(retry.status).toBe(402);
    expect(await countEntries(ACTOR_INSUF)).toBe(0);
    expect(await countJso(ACTOR_INSUF)).toBe(1);

    // Legacy path: upfront balance check — never creates entry or JSO
    setIdempotencyFlag(false);
    const legacy = await seedActor({ email: ACTOR_LEGACY, donguri: 0 });
    const legacyRes = await postJournal(
      ACTOR_LEGACY,
      baseBody(legacy.profileId, { content: "legacy insufficient" }),
    );
    expect(legacyRes.status).toBe(402);
    expect(legacyRes.json.code).toBe("ACORN_INSUFFICIENT");
    expect(await countEntries(ACTOR_LEGACY)).toBe(0);
    expect(await countJso(ACTOR_LEGACY)).toBe(0);
  });

  it("E2E11 photo first/retry/response-loss without duplicate photo bytes path", async () => {
    setIdempotencyFlag(true);
    const { profileId } = await seedActor({ email: ACTOR_PHOTO });
    const op = newOp("PT");
    const body = baseBody(profileId, {
      saveOperationId: op,
      content: "4B-4Z photo save",
      photoDataUrl: TINY_PNG,
    });
    const first = await postJournal(ACTOR_PHOTO, body);
    expect(first.status).toBe(200);
    const entryId = (first.json.entry as { id: string }).id;
    const stored = await prisma.journalEntry.findUnique({ where: { id: entryId } });
    expect(stored?.photoDataUrl).toBe(TINY_PNG);
    expect(stored?.photoBlobUrl).toBeNull();

    const retry = await postJournal(ACTOR_PHOTO, body);
    expect(retry.status).toBe(200);
    expect((retry.json.saveOperation as { reused: boolean }).reused).toBe(true);
    expect((retry.json.entry as { id: string }).id).toBe(entryId);

    const lostRetry = await postJournal(ACTOR_PHOTO, body);
    expect(lostRetry.status).toBe(200);

    expect(await countEntries(ACTOR_PHOTO)).toBe(1);
    expect(await countDiarySaveCharges(ACTOR_PHOTO)).toBe(1);
    const after = await prisma.journalEntry.findUnique({ where: { id: entryId } });
    expect(after?.photoDataUrl).toBe(TINY_PNG);
  });

  it("E2E12 cross-actor isolation with cookie ownership", async () => {
    setIdempotencyFlag(true);
    const a = await seedActor({ email: ACTOR_A });
    const b = await seedActor({ email: ACTOR_B });
    const op = newOp("XA"); // same saveOperationId string
    const bodyA = baseBody(a.profileId, {
      saveOperationId: op,
      content: "actor A content",
    });
    const bodyB = baseBody(b.profileId, {
      saveOperationId: op,
      content: "actor B content",
    });

    const resA = await postJournal(ACTOR_A, bodyA);
    const resB = await postJournal(ACTOR_B, bodyB);
    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    const idA = (resA.json.entry as { id: string }).id;
    const idB = (resB.json.entry as { id: string }).id;
    expect(idA).not.toBe(idB);

    // Cookie for A must not return B's entry via same op id
    const retryA = await postJournal(ACTOR_A, bodyA);
    expect((retryA.json.entry as { id: string }).id).toBe(idA);

    expect(await countEntries(ACTOR_A)).toBe(1);
    expect(await countEntries(ACTOR_B)).toBe(1);
    expect(await countJso(ACTOR_A)).toBe(1);
    expect(await countJso(ACTOR_B)).toBe(1);
  });

  it("account delete removes JSO even when idempotency flag OFF", async () => {
    setIdempotencyFlag(false);
    const { profileId } = await seedActor({ email: ACTOR_DEL });
    await prisma.journalSaveOperation.create({
      data: {
        actorKey: ACTOR_DEL,
        saveOperationId: newOp("DL"),
        status: "completed",
        checkpoint: "completed",
        journalEntryId: null,
        requestFingerprint: "fp-delete-audit",
        resultCode: "OK",
        completedAt: new Date(),
      },
    });
    await prisma.journalEntry.create({
      data: {
        email: ACTOR_DEL,
        profileId,
        content: "to delete",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
      },
    });
    expect(await countJso(ACTOR_DEL)).toBe(1);

    const result = await deleteUserAccount({
      emailInput: ACTOR_DEL,
      confirmationWord: ACCOUNT_DELETE_CONFIRMATION_WORD,
    });
    expect(result.email).toBe(ACTOR_DEL);
    expect(await countJso(ACTOR_DEL)).toBe(0);
    expect(await countEntries(ACTOR_DEL)).toBe(0);
    expect(await prisma.profile.count({ where: { email: ACTOR_DEL } })).toBe(0);
  });

  it("final DB invariants: no leftover 4b4z fixture pollution outside cleaned actors", async () => {
    await cleanupActors();
    for (const email of ALL_ACTORS) {
      expect(await countEntries(email)).toBe(0);
      expect(await countJso(email)).toBe(0);
      expect(await countDiarySaveCharges(email)).toBe(0);
    }
    const stray = await prisma.journalSaveOperation.count({
      where: { actorKey: { endsWith: "@ljd.invalid" } },
    });
    expect(stray).toBe(0);
  });
});

/**
 * AI-X6.7C1.5A2-I3.8 — AccountSettings identity-first (local disposable only).
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon / Production.
 *
 * Run:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/forestResident/forestResidentNumber.i38.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { ensureForestResidentForEmail } from "@/lib/forestResident/forestResidentNumber";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i38";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const EMAIL_C = `${PREFIX}-c@ljd.invalid`;
const UID_A = `${PREFIX}-uid-a`;
const UID_B = `${PREFIX}-uid-b`;
const FRN_A = "BN-000802210";

async function wipe() {
  await prisma.profile.deleteMany({ where: { email: { startsWith: `${PREFIX}-` } } });
  await prisma.accountSettings.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentityEmail.deleteMany({
    where: { emailNormalized: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { startsWith: `${PREFIX}-` } },
  });
}

function ownershipBound(identityId: string, uid: string, emailMeta: string) {
  return {
    state: "BOUND" as const,
    identityId,
    firebaseUid: uid,
    evidenceSource: "VERIFIED_FIREBASE_UID" as const,
    legacyActorKeys: [] as string[],
    verifiedEmailMetadata: emailMeta,
    reason: "verified_uid_identity_bound",
  };
}

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I3.8 forest resident identity-first", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
  });

  beforeEach(async () => {
    // Mode B — I3.8 identity-safe path under verified-auth ON.
    process.env[VERIFIED_AUTH_SESSION_FLAG] = "YES";
    await wipe();
  });

  afterAll(async () => {
    await wipe();
    await prisma.$disconnect();
  });

  it("T1 — normal bound A: canonical returned, no create", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    const settings = await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const before = await prisma.accountSettings.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_A, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_A),
    });
    expect(card?.residentNumber).toBe(FRN_A);
    expect(allocate).not.toHaveBeenCalled();
    expect(
      await prisma.accountSettings.count({
        where: { email: { startsWith: `${PREFIX}-` } },
      }),
    ).toBe(before);
    expect(
      (await prisma.accountSettings.findUnique({ where: { id: settings.id } }))!
        .forestResidentNumber,
    ).toBe(FRN_A);
  });

  it("T2 — transition gap UID-A/EMAIL-B: canonical A, no B row, no FRN", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    const settings = await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });
    expect(card?.residentNumber).toBe(FRN_A);
    expect(allocate).not.toHaveBeenCalled();
    expect(await prisma.accountSettings.count({ where: { email: EMAIL_B } })).toBe(0);
    expect(
      (await prisma.accountSettings.findUnique({ where: { id: settings.id } }))!.email,
    ).toBe(EMAIL_A);
  });

  it("T3 — post-transition A retired / B primary: same canonical", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: {
          create: [
            {
              emailNormalized: EMAIL_A,
              status: "retired",
              retiredAt: new Date(),
            },
            { emailNormalized: EMAIL_B, status: "primary" },
          ],
        },
      },
      select: { id: true },
    });
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });
    expect(card?.residentNumber).toBe(FRN_A);
    expect(allocate).not.toHaveBeenCalled();
    expect(
      await prisma.accountSettings.count({
        where: { email: { startsWith: `${PREFIX}-` } },
      }),
    ).toBe(1);
  });

  it("T4 — verified_session_required: zero INSERT / zero FRN", async () => {
    const before = await prisma.accountSettings.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(
      await prisma.accountSettings.count({
        where: { email: { startsWith: `${PREFIX}-` } },
      }),
    ).toBe(before);
  });

  it("T4B — reused EMAIL-A identity-owned: transient must not expose BN-A", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const beforeCount = await prisma.accountSettings.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_A, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(
      await prisma.accountSettings.count({
        where: { email: { startsWith: `${PREFIX}-` } },
      }),
    ).toBe(beforeCount);
    const aAfter = await prisma.accountSettings.findUnique({ where: { email: EMAIL_A } });
    expect(aAfter!.forestResidentNumber).toBe(FRN_A);
    expect(aAfter!.identityId).toBe(idA.id);
  });

  it("T4C — null-identity issued EMAIL-B: transient must not expose BN-X", async () => {
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_B,
        identityId: null,
        forestResidentNumber: "BN-000802211",
        forestResidentIssuedAt: new Date("2026-02-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const beforeCount = await prisma.accountSettings.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
    expect(
      await prisma.accountSettings.count({
        where: { email: { startsWith: `${PREFIX}-` } },
      }),
    ).toBe(beforeCount);
    const bAfter = await prisma.accountSettings.findUnique({ where: { email: EMAIL_B } });
    expect(bAfter!.forestResidentNumber).toBe("BN-000802211");
    expect(bAfter!.identityId).toBeNull();
  });

  it("T5 — identity_not_bound bootstrap preserved", async () => {
    const allocate = vi.fn(async () => "BN-000802220");
    const card = await ensureForestResidentForEmail(EMAIL_C, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: UID_A,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_C,
        reason: "identity_not_bound",
      }),
    });
    expect(card?.residentNumber).toBe("BN-000802220");
    expect(allocate).toHaveBeenCalledTimes(1);
    const row = await prisma.accountSettings.findUnique({ where: { email: EMAIL_C } });
    expect(row?.identityId).toBeNull();
    expect(row?.forestResidentNumber).toBe("BN-000802220");
  });

  it("T6 — canonical A + null B: never auto-claim B", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const orphan = await prisma.accountSettings.create({
      data: {
        email: EMAIL_B,
        identityId: null,
        forestResidentNumber: "BN-000802211",
        forestResidentIssuedAt: new Date("2026-02-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });
    expect(card?.residentNumber).toBe(FRN_A);
    expect(allocate).not.toHaveBeenCalled();
    const orphanAfter = await prisma.accountSettings.findUnique({ where: { id: orphan.id } });
    expect(orphanAfter!.identityId).toBeNull();
    expect(orphanAfter!.forestResidentNumber).toBe("BN-000802211");
  });

  it("T7 — UID-B reuses EMAIL-A: no history transfer", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    const idB = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_B,
        emails: { create: { emailNormalized: EMAIL_B, status: "primary" } },
      },
      select: { id: true },
    });
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const allocate = vi.fn(async () => "BN-000802230");
    const card = await ensureForestResidentForEmail(EMAIL_A, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ownershipBound(idB.id, UID_B, EMAIL_A),
    });
    // EMAIL-A is owned by UID-A — fail closed; never transfer FRN / identity.
    expect(card).toBeNull();
    const aAfter = await prisma.accountSettings.findFirst({
      where: { identityId: idA.id },
    });
    expect(aAfter!.forestResidentNumber).toBe(FRN_A);
    expect(aAfter!.identityId).toBe(idA.id);
    expect(aAfter!.email).toBe(EMAIL_A);
    expect(
      await prisma.accountSettings.count({ where: { identityId: idB.id } }),
    ).toBe(0);
  });

  it("T8 — concurrent BOUND B requests: no B duplicate", async () => {
    const idA = await prisma.accountIdentity.create({
      data: {
        firebaseUid: UID_A,
        emails: { create: { emailNormalized: EMAIL_A, status: "primary" } },
      },
      select: { id: true },
    });
    await prisma.accountSettings.create({
      data: {
        email: EMAIL_A,
        identityId: idA.id,
        forestResidentNumber: FRN_A,
        forestResidentIssuedAt: new Date("2026-01-01T00:00:00Z"),
        profileLimit: 1,
      },
    });
    const allocate = vi.fn(async () => "BN-000802999");
    const ownership = ownershipBound(idA.id, UID_A, EMAIL_B);
    await Promise.all(
      Array.from({ length: 8 }, () =>
        ensureForestResidentForEmail(EMAIL_B, {
          allocateResidentNumber: allocate,
          resolveOwnership: async () => ownership,
        }),
      ),
    );
    expect(allocate).not.toHaveBeenCalled();
    expect(await prisma.accountSettings.count({ where: { email: EMAIL_B } })).toBe(0);
    expect(
      await prisma.accountSettings.count({ where: { identityId: idA.id } }),
    ).toBe(1);
  });

  it("T9 — resident-card transient: zero create (source writer)", async () => {
    const allocate = vi.fn(async () => "BN-000802999");
    const card = await ensureForestResidentForEmail(EMAIL_B, {
      allocateResidentNumber: allocate,
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: null,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: "",
        reason: "verified_session_required",
      }),
    });
    expect(card).toBeNull();
    expect(allocate).not.toHaveBeenCalled();
  });
});

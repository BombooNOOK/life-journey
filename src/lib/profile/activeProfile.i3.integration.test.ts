/**
 * AI-X6.7C1.5A2-I3 — identity-safe Profile bootstrap (local disposable only).
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon / Production.
 *
 * Run:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/profile/activeProfile.i3.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { P0_IDENTITY_READ_AUTHORITY_FLAG } from "@/lib/account/p0IdentityReadAuthorityGate";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  ensureDefaultProfile,
  listProfilesAndActiveProfileId,
  PROFILE_COOKIE_KEY,
} from "@/lib/profile/activeProfile";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i3";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const UID_A = `${PREFIX}-uid-a`;
const UID_B = `${PREFIX}-uid-b`;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === PROFILE_COOKIE_KEY) {
        return { value: process.env.__I3_COOKIE_PROFILE_ID ?? "" };
      }
      return undefined;
    },
  }),
}));

async function wipe() {
  await prisma.accountIdentityLegacyActorClaim.deleteMany({
    where: { identity: { firebaseUid: { startsWith: `${PREFIX}-` } } },
  });
  await prisma.profile.deleteMany({
    where: { email: { startsWith: `${PREFIX}-` } },
  });
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

async function seedIdentity(uid: string, primaryEmail: string) {
  return prisma.accountIdentity.create({
    data: {
      firebaseUid: uid,
      emails: {
        create: { emailNormalized: primaryEmail, status: "primary" },
      },
    },
    select: { id: true },
  });
}

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I3 identity-safe profile bootstrap", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    expect(audit.isNeonLike).toBe(false);
    console.log(
      `I3_LOCAL_DB host=${audit.host} port=${audit.port} database=${audit.database}`,
    );
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    delete process.env.__I3_COOKIE_PROFILE_ID;
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
    await prisma.$disconnect();
  });

  it("T_PROFILE_EMAIL_CHANGE_NO_DUPLICATE + T_IDENTITY_PROFILE_PRECEDENCE", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: {
        email: EMAIL_A,
        nickname: "メイン",
        identityId: idA.id,
      },
    });
    const before = await prisma.profile.count({
      where: { identityId: idA.id },
    });

    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ({
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: UID_A,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      }),
    });

    const afterRows = await prisma.profile.findMany({
      where: { OR: [{ identityId: idA.id }, { email: { in: [EMAIL_A, EMAIL_B] } }] },
      orderBy: { createdAt: "asc" },
    });
    expect(afterRows).toHaveLength(before);
    expect(afterRows).toHaveLength(1);
    expect(afterRows[0]!.id).toBe(p1.id);
    expect(afterRows[0]!.email).toBe(EMAIL_A);
    expect(afterRows[0]!.identityId).toBe(idA.id);
    expect(afterRows.some((r) => r.email === EMAIL_B)).toBe(false);
  });

  it("T_PROFILE_EMAIL_REUSE_NO_HISTORY_TRANSFER", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });

    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");

    const ownershipB = {
      state: "BOUND" as const,
      identityId: idB.id,
      firebaseUid: UID_B,
      evidenceSource: "VERIFIED_FIREBASE_UID" as const,
      legacyActorKeys: [] as string[],
      verifiedEmailMetadata: EMAIL_A,
      reason: "ok",
    };

    // UID-B session presents EMAIL-A (reuse). Must not receive / claim P1.
    await ensureDefaultProfile(EMAIL_A, {
      resolveOwnership: async () => ownershipB,
    });

    const ownershipMod = await import("@/lib/account/p0IdentityOwnership");
    const spy = vi
      .spyOn(ownershipMod, "resolveP0IdentityOwnership")
      .mockResolvedValue(ownershipB);

    const { profiles } = await listProfilesAndActiveProfileId(EMAIL_A);
    spy.mockRestore();

    const p1After = await prisma.profile.findUnique({ where: { id: p1.id } });
    expect(p1After!.identityId).toBe(idA.id);
    expect(p1After!.email).toBe(EMAIL_A);
    const bOwned = await prisma.profile.count({
      where: { identityId: idB.id, isArchived: false },
    });
    expect(bOwned).toBe(0);
    expect(profiles.every((p) => p.id !== p1.id)).toBe(true);
  });

  it("T_NO_IDENTITY_PROFILE: BOUND but no Profile — does not claim NULL-identity email row", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const orphan = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "orphan", identityId: null },
    });

    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ({
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: UID_A,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      }),
    });

    const orphanAfter = await prisma.profile.findUnique({ where: { id: orphan.id } });
    expect(orphanAfter!.identityId).toBeNull();
    expect(orphanAfter!.email).toBe(EMAIL_A);
    // May create EMAIL-B default (no identity-owned profile, email B absent) — allowed.
    // Must not rebind orphan.
    const claimed = await prisma.profile.findFirst({
      where: { id: orphan.id, identityId: idA.id },
    });
    expect(claimed).toBeNull();
  });

  it("T_LEGACY_UNBOUND_PROFILE_BOOTSTRAP_REGRESSION", async () => {
    await ensureDefaultProfile(EMAIL_A, {
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
    const rows = await prisma.profile.findMany({ where: { email: EMAIL_A } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.nickname).toBe("メイン");
    expect(rows[0]!.identityId).toBeNull();
  });

  it("T_IDENTITY_FEATURE_OFF_REGRESSION — unbound ownership keeps email bootstrap", async () => {
    // Gate off → resolveOwnership returns UNBOUND in real app; simulate here.
    await ensureDefaultProfile(EMAIL_A, {
      resolveOwnership: async () => ({
        state: "UNBOUND",
        identityId: null,
        firebaseUid: UID_A,
        evidenceSource: "NONE",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_A,
        reason: "identity_not_bound",
      }),
    });
    const rows = await prisma.profile.findMany({ where: { email: EMAIL_A } });
    expect(rows).toHaveLength(1);
  });

  it("T_ACTIVE_PROFILE_REGRESSION — cookie selection preserved; no duplicate", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    const p2 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "Alt", identityId: idA.id },
    });
    process.env.__I3_COOKIE_PROFILE_ID = p2.id;
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");

    // listProfilesAndActiveProfileId needs real ownership via session — inject by
    // calling ensure + authority list with mocked ownership through ensure only.
    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ({
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: UID_A,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      }),
    });

    const count = await prisma.profile.count({ where: { identityId: idA.id } });
    expect(count).toBe(2);

    // Simulate active selection rule locally (same as listProfilesAndActiveProfileId)
    const listed = await prisma.profile.findMany({
      where: { identityId: idA.id, isArchived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, nickname: true },
    });
    const cookieProfileId = process.env.__I3_COOKIE_PROFILE_ID ?? "";
    const activeProfileId =
      cookieProfileId && listed.some((p) => p.id === cookieProfileId)
        ? cookieProfileId
        : listed[0]!.id;
    expect(activeProfileId).toBe(p2.id);
    expect(listed.map((p) => p.id).sort()).toEqual([p1.id, p2.id].sort());
  });

  it("T_API_PROFILES_POST_EMAIL_CHANGE — list under P0 read returns P1 only", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    process.env.__I3_COOKIE_PROFILE_ID = p1.id;
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");

    const ownershipA = {
      state: "BOUND" as const,
      identityId: idA.id,
      firebaseUid: UID_A,
      evidenceSource: "VERIFIED_FIREBASE_UID" as const,
      legacyActorKeys: [] as string[],
      verifiedEmailMetadata: EMAIL_B,
      reason: "ok",
    };

    const ownershipMod = await import("@/lib/account/p0IdentityOwnership");
    const spy = vi
      .spyOn(ownershipMod, "resolveP0IdentityOwnership")
      .mockResolvedValue(ownershipA);

    // Mirrors GET /api/profiles → listProfilesAndActiveProfileId(sessionEmail=B)
    const { profiles, activeProfileId } = await listProfilesAndActiveProfileId(EMAIL_B);
    spy.mockRestore();

    expect(profiles).toHaveLength(1);
    expect(profiles[0]!.id).toBe(p1.id);
    expect(activeProfileId).toBe(p1.id);

    const all = await prisma.profile.findMany({
      where: { OR: [{ identityId: idA.id }, { email: EMAIL_B }] },
    });
    expect(all).toHaveLength(1);
    expect(all[0]!.email).toBe(EMAIL_A);
    expect(all[0]!.identityId).toBe(idA.id);
  });

  it("I3_UPDATES_PROFILE_EMAIL=NO and no non-profile product mutations", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const settings = await prisma.accountSettings.create({
      data: { email: EMAIL_A, identityId: idA.id, profileLimit: 1 },
    });
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });

    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ({
        state: "BOUND",
        identityId: idA.id,
        firebaseUid: UID_A,
        evidenceSource: "VERIFIED_FIREBASE_UID",
        legacyActorKeys: [],
        verifiedEmailMetadata: EMAIL_B,
        reason: "ok",
      }),
    });

    const p1After = await prisma.profile.findUnique({ where: { id: p1.id } });
    const settingsAfter = await prisma.accountSettings.findUnique({
      where: { id: settings.id },
    });
    expect(p1After!.email).toBe(EMAIL_A);
    expect(p1After!.identityId).toBe(idA.id);
    expect(settingsAfter!.email).toBe(EMAIL_A);
    expect(settingsAfter!.identityId).toBe(idA.id);
  });
});

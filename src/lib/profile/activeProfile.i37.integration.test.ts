/**
 * AI-X6.7C1.5A2-I3.7 — transition-gap Profile bootstrap (local disposable only).
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon / Production.
 *
 * Run:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/profile/activeProfile.i37.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { P0_IDENTITY_READ_AUTHORITY_FLAG } from "@/lib/account/p0IdentityReadAuthorityGate";
import { VERIFIED_AUTH_SESSION_FLAG } from "@/lib/auth/verifiedAuthSessionGate";
import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import {
  defaultProfileIdForEmail,
  ensureDefaultProfile,
  listProfilesAndActiveProfileId,
} from "@/lib/profile/activeProfile";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i37";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const UID_A = `${PREFIX}-uid-a`;
const UID_B = `${PREFIX}-uid-b`;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
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
        create: [{ emailNormalized: primaryEmail, status: "primary" }],
      },
    },
    select: { id: true },
  });
}

function ownershipBound(
  identityId: string,
  uid: string,
  emailMeta: string,
) {
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

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I3.7 transition-gap profile safety", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    expect(audit.isNeonLike).toBe(false);
  });

  beforeEach(async () => {
    vi.unstubAllEnvs();
    // Mode B — I3.7 fail-closed under verified-auth ON.
    process.env[VERIFIED_AUTH_SESSION_FLAG] = "YES";
    await wipe();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await wipe();
    await prisma.$disconnect();
  });

  it("T1 — normal bound A: no insert", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    const before = await prisma.profile.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    await ensureDefaultProfile(EMAIL_A, {
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_A),
    });
    expect(
      await prisma.profile.count({ where: { email: { startsWith: `${PREFIX}-` } } }),
    ).toBe(before);
    const row = await prisma.profile.findUnique({ where: { id: p1.id } });
    expect(row!.identityId).toBe(idA.id);
    expect(row!.email).toBe(EMAIL_A);
  });

  it("T2 — transition gap with verified B session: canonical A, no B insert", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    const before = await prisma.profile.count({
      where: { OR: [{ identityId: idA.id }, { email: EMAIL_B }] },
    });
    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });
    const after = await prisma.profile.findMany({
      where: { OR: [{ identityId: idA.id }, { email: EMAIL_B }] },
    });
    expect(after).toHaveLength(before);
    expect(after[0]!.id).toBe(p1.id);
    expect(after.some((r) => r.email === EMAIL_B)).toBe(false);
  });

  it("T3 — post-transition A retired / B primary: same canonical, no duplicate", async () => {
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
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });
    const rows = await prisma.profile.findMany({
      where: { OR: [{ identityId: idA.id }, { email: { in: [EMAIL_A, EMAIL_B] } }] },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe(p1.id);
    expect(rows[0]!.email).toBe(EMAIL_A);
  });

  it("T4 — UID-B reuses EMAIL-A: no history transfer", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const idB = await seedIdentity(UID_B, EMAIL_B);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");

    const ownershipB = ownershipBound(idB.id, UID_B, EMAIL_A);
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
    expect(profiles.every((p) => p.id !== p1.id)).toBe(true);
    expect(
      await prisma.profile.count({ where: { identityId: idB.id, isArchived: false } }),
    ).toBe(0);
  });

  it("T5 — canonical A + existing null legacy B: never auto-claim", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    const p1 = await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    const orphan = await prisma.profile.create({
      data: {
        id: defaultProfileIdForEmail(EMAIL_B),
        email: EMAIL_B,
        nickname: "メイン",
        identityId: null,
      },
    });

    await ensureDefaultProfile(EMAIL_B, {
      resolveOwnership: async () => ownershipBound(idA.id, UID_A, EMAIL_B),
    });

    const orphanAfter = await prisma.profile.findUnique({ where: { id: orphan.id } });
    expect(orphanAfter!.identityId).toBeNull();
    expect(orphanAfter!.email).toBe(EMAIL_B);

    const ownershipMod = await import("@/lib/account/p0IdentityOwnership");
    const spy = vi.spyOn(ownershipMod, "resolveP0IdentityOwnership").mockResolvedValue(
      ownershipBound(idA.id, UID_A, EMAIL_B),
    );
    vi.stubEnv(P0_IDENTITY_READ_AUTHORITY_FLAG, "YES");
    const { profiles, activeProfileId } = await listProfilesAndActiveProfileId(EMAIL_B);
    spy.mockRestore();

    expect(profiles.some((p) => p.id === p1.id)).toBe(true);
    expect(profiles.every((p) => p.id !== orphan.id)).toBe(true);
    expect(activeProfileId).toBe(p1.id);
  });

  it("T6 — critical login race verified_session_required: zero INSERT", async () => {
    const idA = await seedIdentity(UID_A, EMAIL_A);
    await prisma.profile.create({
      data: { email: EMAIL_A, nickname: "メイン", identityId: idA.id },
    });
    const before = await prisma.profile.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });

    await ensureDefaultProfile(EMAIL_B, {
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

    const after = await prisma.profile.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    expect(after).toBe(before);
    expect(
      await prisma.profile.count({ where: { email: EMAIL_B } }),
    ).toBe(0);
    expect(
      await prisma.profile.findUnique({
        where: { id: defaultProfileIdForEmail(EMAIL_B) },
      }),
    ).toBeNull();
  });

  it("T7 — true identity_not_bound preserves bootstrap", async () => {
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
    expect(rows[0]!.id).toBe(defaultProfileIdForEmail(EMAIL_A));
    expect(rows[0]!.identityId).toBeNull();
  });

  it("T8 — concurrent verified_session_required: zero inserts", async () => {
    const before = await prisma.profile.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const ownership = {
      state: "UNBOUND" as const,
      identityId: null,
      firebaseUid: null,
      evidenceSource: "NONE" as const,
      legacyActorKeys: [] as string[],
      verifiedEmailMetadata: "",
      reason: "verified_session_required",
    };
    await Promise.all(
      Array.from({ length: 12 }, () =>
        ensureDefaultProfile(EMAIL_B, { resolveOwnership: async () => ownership }),
      ),
    );
    // Also exercise listProfilesAndActiveProfileId caller path (R1/R2 source-proven)
    const ownershipMod = await import("@/lib/account/p0IdentityOwnership");
    const spy = vi
      .spyOn(ownershipMod, "resolveP0IdentityOwnership")
      .mockResolvedValue(ownership);
    await Promise.all([
      listProfilesAndActiveProfileId(EMAIL_B),
      listProfilesAndActiveProfileId(EMAIL_B),
      listProfilesAndActiveProfileId(EMAIL_B),
    ]);
    spy.mockRestore();

    expect(
      await prisma.profile.count({ where: { email: { startsWith: `${PREFIX}-` } } }),
    ).toBe(before);
    expect(await prisma.profile.count({ where: { email: EMAIL_B } })).toBe(0);
  });

  it("R1/R2/R3 source-proven: listProfilesAndActiveProfileId transient → 0 INSERT", async () => {
    const ownership = {
      state: "UNBOUND" as const,
      identityId: null,
      firebaseUid: null,
      evidenceSource: "NONE" as const,
      legacyActorKeys: [] as string[],
      verifiedEmailMetadata: "",
      reason: "verified_session_required",
    };
    const ownershipMod = await import("@/lib/account/p0IdentityOwnership");
    const spy = vi
      .spyOn(ownershipMod, "resolveP0IdentityOwnership")
      .mockResolvedValue(ownership);

    // Mirrors onboarding-stage-context → firstVisitReady → listProfilesAndActiveProfileId
    // and orders/page.tsx → listProfilesAndActiveProfileId
    const before = await prisma.profile.count({
      where: { email: { startsWith: `${PREFIX}-` } },
    });
    const { profiles, activeProfileId } = await listProfilesAndActiveProfileId(EMAIL_B);
    spy.mockRestore();

    expect(profiles).toHaveLength(0);
    expect(activeProfileId).toBe("");
    expect(
      await prisma.profile.count({ where: { email: { startsWith: `${PREFIX}-` } } }),
    ).toBe(before);
  });
});

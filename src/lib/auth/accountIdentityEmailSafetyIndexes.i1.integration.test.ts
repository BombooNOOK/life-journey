/**
 * AI-X6.7C1.5A2-I1 — AccountIdentityEmail safety indexes (local disposable only).
 *
 * Hard gate: only 127.0.0.1:5433/ljd_dev. Never Neon / Production.
 *
 * Run:
 *   DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public \
 *     RUN_LOCAL_DB_INTEGRATION=1 npm test -- \
 *     src/lib/auth/accountIdentityEmailSafetyIndexes.i1.integration.test.ts
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { auditDatabaseUrlForNonprodIdempotency } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";

const audit = auditDatabaseUrlForNonprodIdempotency(process.env.DATABASE_URL);
const runLocal = process.env.RUN_LOCAL_DB_INTEGRATION === "1" && audit.ok;

const PREFIX = "x67i1";
const EMAIL_A = `${PREFIX}-a@ljd.invalid`;
const EMAIL_B = `${PREFIX}-b@ljd.invalid`;
const EMAIL_C = `${PREFIX}-c@ljd.invalid`;

async function wipeSynthetic() {
  await prisma.accountIdentityEmail.deleteMany({
    where: { emailNormalized: { startsWith: `${PREFIX}-` } },
  });
  await prisma.accountIdentity.deleteMany({
    where: { firebaseUid: { startsWith: `${PREFIX}-` } },
  });
}

async function createIdentity(uidSuffix: string) {
  return prisma.accountIdentity.create({
    data: { firebaseUid: `${PREFIX}-uid-${uidSuffix}` },
    select: { id: true },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

describe.skipIf(!runLocal)("AI-X6.7C1.5A2-I1 AccountIdentityEmail safety indexes", () => {
  beforeAll(() => {
    expect(audit.ok).toBe(true);
    expect(audit.host).toBe("127.0.0.1");
    expect(audit.port).toBe("5433");
    expect(audit.database).toBe("ljd_dev");
    expect(audit.isNeonLike).toBe(false);
  });

  beforeEach(async () => {
    await wipeSynthetic();
  });

  afterAll(async () => {
    await wipeSynthetic();
    await prisma.$disconnect();
  });

  it("catalog: both safety indexes present with expected defs", async () => {
    const rows = await prisma.$queryRaw<
      Array<{ indexname: string; indexdef: string }>
    >`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'AccountIdentityEmail'
      ORDER BY indexname
    `;
    const byName = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef]));
    expect(byName.AccountIdentityEmail_one_primary_per_email).toContain(
      '"emailNormalized"',
    );
    expect(byName.AccountIdentityEmail_one_primary_per_email).toContain(
      "WHERE (status = 'primary'::text)",
    );
    expect(byName.AccountIdentityEmail_identity_email_key).toContain(
      '"identityId"',
    );
    expect(byName.AccountIdentityEmail_identity_email_key).toContain(
      '"emailNormalized"',
    );
    expect(byName.AccountIdentityEmail_one_primary_per_identity).toBeTruthy();
  });

  it("T1–T4 positive: primary, retired pairs, retired reuse", async () => {
    const idA = await createIdentity("a");
    const idB = await createIdentity("b");

    // T1
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });

    // T2 same identity A primary + B retired
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_B,
        status: "retired",
        retiredAt: new Date(),
      },
    });

    // T3 switch to A retired + B primary (simulating prior state rewrite)
    await prisma.$transaction([
      prisma.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_A,
          },
        },
        data: { status: "retired", retiredAt: new Date() },
      }),
      prisma.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_B,
          },
        },
        data: { status: "primary", retiredAt: null },
      }),
    ]);

    // T4 UID-B takes primary A while UID-A has A retired
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idB.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });

    const aRows = await prisma.accountIdentityEmail.findMany({
      where: { identityId: idA.id },
      orderBy: { emailNormalized: "asc" },
    });
    const bRows = await prisma.accountIdentityEmail.findMany({
      where: { identityId: idB.id },
    });
    expect(aRows).toHaveLength(2);
    expect(aRows.find((r) => r.emailNormalized === EMAIL_A)?.status).toBe("retired");
    expect(aRows.find((r) => r.emailNormalized === EMAIL_B)?.status).toBe("primary");
    expect(bRows).toHaveLength(1);
    expect(bRows[0]!.emailNormalized).toBe(EMAIL_A);
    expect(bRows[0]!.status).toBe("primary");
  });

  it("T5 foreign double primary rejected", async () => {
    const idA = await createIdentity("a");
    const idB = await createIdentity("b");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_B,
        status: "primary",
      },
    });
    await expect(
      prisma.accountIdentityEmail.create({
        data: {
          identityId: idB.id,
          emailNormalized: EMAIL_B,
          status: "primary",
        },
      }),
    ).rejects.toSatisfy(isUniqueViolation);
  });

  it("T6 duplicate identity/email pair rejected", async () => {
    const idA = await createIdentity("a");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });
    await expect(
      prisma.accountIdentityEmail.create({
        data: {
          identityId: idA.id,
          emailNormalized: EMAIL_A,
          status: "retired",
          retiredAt: new Date(),
        },
      }),
    ).rejects.toSatisfy(isUniqueViolation);
  });

  it("T7 double primary per identity rejected", async () => {
    const idA = await createIdentity("a");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });
    await expect(
      prisma.accountIdentityEmail.create({
        data: {
          identityId: idA.id,
          emailNormalized: EMAIL_B,
          status: "primary",
        },
      }),
    ).rejects.toSatisfy(isUniqueViolation);
  });

  it("T8 A→B switch: retire A then insert B primary in one TX", async () => {
    const idA = await createIdentity("a");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_A,
          },
        },
        data: { status: "retired", retiredAt: new Date() },
      });
      await tx.accountIdentityEmail.create({
        data: {
          identityId: idA.id,
          emailNormalized: EMAIL_B,
          status: "primary",
        },
      });
    });

    const rows = await prisma.accountIdentityEmail.findMany({
      where: { identityId: idA.id },
      orderBy: { emailNormalized: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.emailNormalized === EMAIL_A)?.status).toBe("retired");
    expect(rows.find((r) => r.emailNormalized === EMAIL_B)?.status).toBe("primary");
  });

  it("T9 rollback restores A primary when B establish fails", async () => {
    const idA = await createIdentity("a");
    const idOther = await createIdentity("other");
    // Foreign already holds B primary → local B primary will fail
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idOther.id,
        emailNormalized: EMAIL_B,
        status: "primary",
      },
    });
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.accountIdentityEmail.update({
          where: {
            identityId_emailNormalized: {
              identityId: idA.id,
              emailNormalized: EMAIL_A,
            },
          },
          data: { status: "retired", retiredAt: new Date() },
        });
        await tx.accountIdentityEmail.create({
          data: {
            identityId: idA.id,
            emailNormalized: EMAIL_B,
            status: "primary",
          },
        });
      }),
    ).rejects.toSatisfy(isUniqueViolation);

    const aRow = await prisma.accountIdentityEmail.findUnique({
      where: {
        identityId_emailNormalized: {
          identityId: idA.id,
          emailNormalized: EMAIL_A,
        },
      },
    });
    expect(aRow?.status).toBe("primary");
    expect(aRow?.retiredAt).toBeNull();
    const bOnA = await prisma.accountIdentityEmail.findUnique({
      where: {
        identityId_emailNormalized: {
          identityId: idA.id,
          emailNormalized: EMAIL_B,
        },
      },
    });
    expect(bOnA).toBeNull();
  });

  it("T10 retired email reuse: UID-B primary A while UID-A A retired", async () => {
    const idA = await createIdentity("a");
    const idB = await createIdentity("b");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "retired",
        retiredAt: new Date(),
      },
    });
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_B,
        status: "primary",
      },
    });
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idB.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });
    const rows = await prisma.accountIdentityEmail.findMany({
      where: { emailNormalized: EMAIL_A },
      orderBy: { status: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.status).sort()).toEqual(["primary", "retired"]);
  });

  it("T11 A→B→A reactivation: exactly 2 rows, no duplicate A", async () => {
    const idA = await createIdentity("a");
    await prisma.accountIdentityEmail.create({
      data: {
        identityId: idA.id,
        emailNormalized: EMAIL_A,
        status: "primary",
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_A,
          },
        },
        data: { status: "retired", retiredAt: new Date() },
      });
      await tx.accountIdentityEmail.create({
        data: {
          identityId: idA.id,
          emailNormalized: EMAIL_B,
          status: "primary",
        },
      });
    });

    await prisma.$transaction(async (tx) => {
      await tx.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_B,
          },
        },
        data: { status: "retired", retiredAt: new Date() },
      });
      await tx.accountIdentityEmail.update({
        where: {
          identityId_emailNormalized: {
            identityId: idA.id,
            emailNormalized: EMAIL_A,
          },
        },
        data: { status: "primary", retiredAt: null, boundAt: new Date() },
      });
    });

    const rows = await prisma.accountIdentityEmail.findMany({
      where: { identityId: idA.id },
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.emailNormalized === EMAIL_A)?.status).toBe("primary");
    expect(rows.find((r) => r.emailNormalized === EMAIL_B)?.status).toBe("retired");
  });

  it("T12 concurrent double primary prevented (actual)", async () => {
    const idA = await createIdentity("a");
    const idB = await createIdentity("b");

    const results = await Promise.allSettled([
      prisma.accountIdentityEmail.create({
        data: {
          identityId: idA.id,
          emailNormalized: EMAIL_C,
          status: "primary",
        },
      }),
      prisma.accountIdentityEmail.create({
        data: {
          identityId: idB.id,
          emailNormalized: EMAIL_C,
          status: "primary",
        },
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(isUniqueViolation((rejected[0] as PromiseRejectedResult).reason)).toBe(
      true,
    );

    const primaries = await prisma.accountIdentityEmail.findMany({
      where: { emailNormalized: EMAIL_C, status: "primary" },
    });
    expect(primaries).toHaveLength(1);
  });
});

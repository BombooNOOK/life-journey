/**
 * Exact-actor seed / cleanup for local E2E on 127.0.0.1:5433/ljd_dev.
 */

import { prisma } from "@/lib/db";
import { assertLocalDisposableDatabaseUrl } from "@/lib/journal/saveIdempotency/assertLocalDisposableDatabaseUrl";
import { JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION } from "@/lib/journal/saveIdempotency/rolloutProtocol";
import { resolveLocalE2eActorEmail } from "@/lib/localE2eHarness/gate";

export type LocalE2eActorFixture = {
  email: string;
  profileId: string;
};

export async function seedLocalE2eActorFixture(options?: {
  email?: string;
  donguri?: number;
  nickname?: string;
}): Promise<LocalE2eActorFixture> {
  assertLocalDisposableDatabaseUrl();
  const email = resolveLocalE2eActorEmail(options?.email) ?? resolveLocalE2eActorEmail();
  if (!email) throw new Error("local_e2e_actor_email_required");

  const residentNumber = `LJE2E-${email.slice(0, 8)}`;
  await prisma.accountSettings.upsert({
    where: { email },
    create: {
      email,
      isAdmin: false,
      isMonitor: true,
      profileLimit: 3,
      forestResidentNumber: residentNumber,
      forestResidentIssuedAt: new Date(),
      forestResidentDisplayName: options?.nickname ?? "local-e2e",
    },
    update: {
      isMonitor: true,
      profileLimit: 3,
      forestResidentNumber: residentNumber,
      forestResidentIssuedAt: new Date(),
      forestResidentDisplayName: options?.nickname ?? "local-e2e",
    },
  });

  const existing = await prisma.profile.findFirst({
    where: { email },
    orderBy: { createdAt: "asc" },
  });
  const profile =
    existing ??
    (await prisma.profile.create({
      data: {
        email,
        nickname: options?.nickname ?? "local-e2e",
      },
    }));

  // Journal/Companion require onboarding stage >= 3 (hasKanteiOrder).
  const existingOrder = await prisma.order.findFirst({
    where: { email, profileId: profile.id },
    select: { id: true },
  });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        lastName: "検証",
        firstName: "太郎",
        lastNameKana: "ケンショウ",
        firstNameKana: "タロウ",
        lastNameRoman: "KENSHO",
        firstNameRoman: "TARO",
        fullNameDisplay: "検証 太郎",
        fullNameKanaDisplay: "ケンショウ タロウ",
        fullNameRomanDisplay: "KENSHO TARO",
        birthDate: "1990-01-15",
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 15,
        postalCode: "1000001",
        address: "東京都千代田区1-1 local-e2e",
        phone: "09000000000",
        email,
        profileId: profile.id,
        numerologyJson: JSON.stringify({ lifePath: 1, source: "local-e2e" }),
        stonesJson: JSON.stringify([]),
        stoneFocusTheme: "特に決まっていない",
        status: "completed",
        kanteiCode: `LJK-E2E-${Date.now().toString(36).toUpperCase()}`,
      },
    });
  }

  const amount = options?.donguri ?? 50;
  if (amount !== 0) {
    await prisma.logHouseDonguriLedgerEntry.create({
      data: {
        email,
        profileId: profile.id,
        amount,
        reason: "admin_grant",
        title: "local-e2e grant",
        dateKey: `local-e2e-grant-${Date.now()}`,
        createdBy: "admin",
      },
    });
  }

  await prisma.journalSaveIdempotencyRollout.upsert({
    where: { actorKey: email },
    create: {
      actorKey: email,
      protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
      enabled: true,
    },
    update: {
      protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
      enabled: true,
    },
  });

  return { email, profileId: profile.id };
}

/** Exact actor scoped cleanup — never touches other actors. */
export async function cleanupLocalE2eActorFixture(emailInput?: string): Promise<void> {
  assertLocalDisposableDatabaseUrl();
  const email = resolveLocalE2eActorEmail(emailInput) ?? resolveLocalE2eActorEmail();
  if (!email) throw new Error("local_e2e_actor_email_required");

  await prisma.journalSaveOperation.deleteMany({ where: { actorKey: email } });
  await prisma.journalSaveIdempotencyRollout.deleteMany({ where: { actorKey: email } });
  await prisma.journalDraft.deleteMany({ where: { email } });
  await prisma.journalEntry.deleteMany({ where: { email } });
  await prisma.logHouseDonguriLedgerEntry.deleteMany({ where: { email } });
  await prisma.order.deleteMany({ where: { email } });
  await prisma.profile.deleteMany({ where: { email } });
  await prisma.accountSettings.deleteMany({ where: { email } });
}

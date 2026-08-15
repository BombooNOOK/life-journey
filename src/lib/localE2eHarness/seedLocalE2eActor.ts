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
  await prisma.profile.deleteMany({ where: { email } });
  await prisma.accountSettings.deleteMany({ where: { email } });
}

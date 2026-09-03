/**
 * AI-X6.7B2.5 — Disposable-DB backfill load/apply helpers.
 * Caller MUST gate DATABASE_URL to 127.0.0.1:5433/ljd_dev before use.
 */

import type { PrismaClient } from "@prisma/client";

import {
  resolveP0IdentityOwnershipForLegacyEmail,
  type P0BackfillEvidence,
  type P0BackfillResolution,
} from "@/lib/account/p0IdentityOwnershipBackfill";

export type P0ReportEvidenceSource =
  | "BOUND_ACCOUNT_SETTINGS"
  | "EXPLICIT_LEGACY_CLAIM"
  | "HISTORICAL_PRIMARY_IDENTITY_EMAIL"
  | "NONE"
  | "CONFLICT"
  | "CURRENT_AUTH_EMAIL_ONLY"; // forbidden — never emitted by resolver

export function toReportEvidenceSource(
  evidence: P0BackfillResolution["evidence"],
): P0ReportEvidenceSource {
  switch (evidence) {
    case "settings_identityId":
      return "BOUND_ACCOUNT_SETTINGS";
    case "legacy_actor_claim":
      return "EXPLICIT_LEGACY_CLAIM";
    case "primary_identity_email":
      return "HISTORICAL_PRIMARY_IDENTITY_EMAIL";
    case "conflict":
      return "CONFLICT";
    case "none":
      return "NONE";
    default:
      return "NONE";
  }
}

export async function loadP0BackfillEvidenceFromDb(
  prisma: PrismaClient,
): Promise<P0BackfillEvidence> {
  const settings = await prisma.accountSettings.findMany({
    where: { identityId: { not: null } },
    select: { email: true, identityId: true },
  });
  const claims = await prisma.accountIdentityLegacyActorClaim.findMany({
    select: { actorKey: true, identityId: true },
  });
  const primaries = await prisma.accountIdentityEmail.findMany({
    where: { status: "primary" },
    select: { emailNormalized: true, identityId: true },
  });

  const settingsByEmail = new Map<string, string>();
  for (const s of settings) {
    if (!s.identityId) continue;
    settingsByEmail.set(s.email.trim().toLowerCase(), s.identityId);
  }

  const claimByActorKey = new Map<string, string>();
  for (const c of claims) {
    claimByActorKey.set(c.actorKey.trim().toLowerCase(), c.identityId);
  }

  const primaryEmailIdentityIds = new Map<string, string[]>();
  for (const p of primaries) {
    const key = p.emailNormalized.trim().toLowerCase();
    const list = primaryEmailIdentityIds.get(key) ?? [];
    if (!list.includes(p.identityId)) list.push(p.identityId);
    primaryEmailIdentityIds.set(key, list);
  }

  return { settingsByEmail, claimByActorKey, primaryEmailIdentityIds };
}

export type P0BackfillRowDecision = {
  rowAlias: string;
  table: "Profile" | "JournalEntry";
  rowId: string;
  email: string;
  result: P0BackfillResolution["class"];
  targetIdentityId: string | null;
  evidenceSource: P0ReportEvidenceSource;
  reason: string;
};

export async function dryRunP0IdentityOwnershipBackfill(
  prisma: PrismaClient,
  rowAliases?: ReadonlyMap<string, string>,
): Promise<P0BackfillRowDecision[]> {
  const evidence = await loadP0BackfillEvidenceFromDb(prisma);
  const profiles = await prisma.profile.findMany({
    select: { id: true, email: true, identityId: true },
  });
  const journals = await prisma.journalEntry.findMany({
    select: { id: true, email: true, identityId: true },
  });

  const decisions: P0BackfillRowDecision[] = [];
  for (const p of profiles) {
    const r = resolveP0IdentityOwnershipForLegacyEmail(p.email, evidence);
    decisions.push({
      rowAlias: rowAliases?.get(`Profile:${p.id}`) ?? `Profile:${p.id}`,
      table: "Profile",
      rowId: p.id,
      email: p.email,
      result: r.class,
      targetIdentityId: r.identityId,
      evidenceSource: toReportEvidenceSource(r.evidence),
      reason: r.reason,
    });
  }
  for (const j of journals) {
    const r = resolveP0IdentityOwnershipForLegacyEmail(j.email, evidence);
    decisions.push({
      rowAlias: rowAliases?.get(`JournalEntry:${j.id}`) ?? `JournalEntry:${j.id}`,
      table: "JournalEntry",
      rowId: j.id,
      email: j.email,
      result: r.class,
      targetIdentityId: r.identityId,
      evidenceSource: toReportEvidenceSource(r.evidence),
      reason: r.reason,
    });
  }
  return decisions;
}

/**
 * Apply BOUND decisions only. UNBOUND/AMBIGUOUS leave identityId null.
 * Idempotent: re-writing the same identityId is a no-op.
 */
export async function applyP0IdentityOwnershipBackfill(
  prisma: PrismaClient,
): Promise<{
  profileUpdates: number;
  journalUpdates: number;
  skipped: number;
  decisions: P0BackfillRowDecision[];
}> {
  const decisions = await dryRunP0IdentityOwnershipBackfill(prisma);
  let profileUpdates = 0;
  let journalUpdates = 0;
  let skipped = 0;

  for (const d of decisions) {
    if (d.result !== "BOUND" || !d.targetIdentityId) {
      skipped += 1;
      continue;
    }
    if (d.table === "Profile") {
      const res = await prisma.profile.updateMany({
        where: { id: d.rowId, identityId: null },
        data: { identityId: d.targetIdentityId },
      });
      profileUpdates += res.count;
    } else {
      const res = await prisma.journalEntry.updateMany({
        where: { id: d.rowId, identityId: null },
        data: { identityId: d.targetIdentityId },
      });
      journalUpdates += res.count;
    }
  }

  return { profileUpdates, journalUpdates, skipped, decisions };
}

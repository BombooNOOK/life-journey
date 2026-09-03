/**
 * AI-X6.7B7D — SupportInquiry identity ownership authority.
 * Historical email retained for contact/audit.
 * Current email alone NEVER authorizes thread access.
 */

import type { PrismaClient } from "@prisma/client";

import {
  loadP0BackfillEvidenceFromDb,
  toReportEvidenceSource,
} from "@/lib/account/p0IdentityOwnershipBackfillApply";
import { resolveP0IdentityOwnershipForLegacyEmail } from "@/lib/account/p0IdentityOwnershipBackfill";
import { prisma as defaultPrisma } from "@/lib/db";
import { isIdentitySupportAuthorityEnabled } from "@/lib/lifecycle/lifecycleIdentityGates";
import {
  requireBoundLifecycleSubject,
  resolveLifecycleSubject,
  type LifecycleSubject,
} from "@/lib/lifecycle/lifecycleSubject";
import { dualWriteIdentityIdOrNull } from "@/lib/account/p0IdentityOwnership";

export type SupportAuthResult =
  | { ok: true; identityId: string; inquiryId: string; boundIdentityId?: boolean }
  | { ok: false; reason: string; state: string };

export async function listSupportInquiryIdsForSubject(
  subject: Extract<LifecycleSubject, { state: "BOUND" }>,
  db: PrismaClient = defaultPrisma,
): Promise<string[]> {
  const emails = subject.explicitHistoricalEmails;
  const rows = await db.supportInquiry.findMany({
    where: {
      replyChannel: "chat",
      OR: [
        { identityId: subject.identityId },
        ...(emails.length > 0
          ? [{ identityId: null, email: { in: emails } }]
          : []),
      ],
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return rows.map((r) => r.id);
}

export async function authorizeSupportInquiryAccess(input: {
  inquiryId: string;
  subject?: LifecycleSubject;
  bindOnAuthorize?: boolean;
  db?: PrismaClient;
}): Promise<SupportAuthResult> {
  if (!isIdentitySupportAuthorityEnabled()) {
    return { ok: false, reason: "gate_off", state: "LEGACY" };
  }
  const subject = input.subject ?? (await resolveLifecycleSubject());
  const bound = requireBoundLifecycleSubject(subject);
  if (!bound) {
    return {
      ok: false,
      reason: subject.state === "BOUND" ? "unreachable" : subject.reason,
      state: subject.state,
    };
  }

  const db = input.db ?? defaultPrisma;
  const row = await db.supportInquiry.findUnique({
    where: { id: input.inquiryId },
    select: { id: true, identityId: true, email: true },
  });
  if (!row) {
    return { ok: false, reason: "not_found", state: "NOT_FOUND" };
  }

  if (row.identityId && row.identityId === bound.identityId) {
    return { ok: true, identityId: bound.identityId, inquiryId: row.id };
  }
  if (row.identityId && row.identityId !== bound.identityId) {
    return { ok: false, reason: "not_owned", state: "NOT_OWNED" };
  }

  // null identityId — only explicit historical email evidence
  const email = row.email.trim().toLowerCase();
  if (!bound.explicitHistoricalEmails.includes(email)) {
    return {
      ok: false,
      reason: "null_without_explicit_historical_evidence",
      state: "NOT_OWNED",
    };
  }

  if (input.bindOnAuthorize !== false) {
    const updated = await db.supportInquiry.updateMany({
      where: { id: row.id, identityId: null },
      data: { identityId: bound.identityId },
    });
    return {
      ok: true,
      identityId: bound.identityId,
      inquiryId: row.id,
      boundIdentityId: updated.count > 0,
    };
  }

  return { ok: true, identityId: bound.identityId, inquiryId: row.id };
}

export async function supportCreateIdentityFields(): Promise<{ identityId?: string }> {
  if (!isIdentitySupportAuthorityEnabled()) return {};
  const subject = await resolveLifecycleSubject();
  if (subject.state !== "BOUND") return {};
  const id = dualWriteIdentityIdOrNull({
    dualWriteEnabled: true,
    ownership: {
      state: "BOUND",
      identityId: subject.identityId,
      firebaseUid: subject.firebaseUid,
      evidenceSource: "VERIFIED_FIREBASE_UID",
      legacyActorKeys: subject.legacyActorKeys,
      verifiedEmailMetadata: subject.verifiedEmailMetadata,
      reason: "support_create",
    },
  });
  return id ? { identityId: id } : { identityId: subject.identityId };
}

export async function runSupportInquiryIdentityBackfill(
  prisma: PrismaClient,
  options: { mode: "DRY_RUN" | "APPLY"; emailFilter?: ReadonlySet<string> },
): Promise<{ updates: number; decisions: number; alreadyBound: number }> {
  const evidence = await loadP0BackfillEvidenceFromDb(prisma);
  const rows = await prisma.supportInquiry.findMany({
    select: { id: true, email: true, identityId: true },
  });
  let updates = 0;
  let alreadyBound = 0;
  let decisions = 0;

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (options.emailFilter && !options.emailFilter.has(email)) continue;
    decisions += 1;
    if (row.identityId) {
      alreadyBound += 1;
      continue;
    }
    const proposed = resolveP0IdentityOwnershipForLegacyEmail(row.email, evidence);
    void toReportEvidenceSource(proposed.evidence);
    if (proposed.class !== "BOUND" || !proposed.identityId) continue;
    if (options.mode === "APPLY") {
      const res = await prisma.supportInquiry.updateMany({
        where: { id: row.id, identityId: null },
        data: { identityId: proposed.identityId },
      });
      updates += res.count;
    } else {
      updates += 1; // would-update count in dry-run
    }
  }

  return { updates, decisions, alreadyBound };
}

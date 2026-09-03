/**
 * AI-X6.7B7D — Account delete dependency graph + dry-run/apply (disposable).
 *
 * LIFECYCLE SUBJECT = AccountIdentity.id
 * Current email alone NEVER defines delete scope.
 *
 * Policies are explicit; financial/JSO retention may be POLICY_REQUIRED.
 */

import type { PrismaClient } from "@prisma/client";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  jsoActorKeysForSubject,
  lifecycleOwnedWhere,
  requireBoundLifecycleSubject,
  resolveLifecycleSubject,
  type LifecycleSubject,
} from "@/lib/lifecycle/lifecycleSubject";
import { isIdentityAccountDeleteAuthorityEnabled } from "@/lib/lifecycle/lifecycleIdentityGates";

export type DeletePolicy =
  | "DELETE_WITH_ACCOUNT"
  | "ANONYMIZE"
  | "RETAIN_FOR_AUDIT"
  | "RETAIN_FOR_IDEMPOTENCY"
  | "ADMIN_REVIEW_REQUIRED"
  | "POLICY_REQUIRED";

export type DeleteGraphNode = {
  model: string;
  policy: DeletePolicy;
  note: string;
};

/** Explicit dependency / policy graph (documentation + dry-run). */
export const ACCOUNT_DELETE_POLICY_GRAPH: DeleteGraphNode[] = [
  { model: "DiaryBookBindingRequest", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned diary binding" },
  { model: "KanteiBookBindingRequest", policy: "DELETE_WITH_ACCOUNT", note: "via email/order soft link; prefer identity-owned Order" },
  {
    model: "Order",
    policy: "POLICY_REQUIRED",
    note: "App access via identityId; transaction/receipt may RETAIN_FOR_AUDIT — local apply anonymizes identityId+email contact",
  },
  { model: "DiaryBook", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned" },
  { model: "DiaryBookshelfBook", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned" },
  { model: "JournalEntry", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned P0" },
  { model: "JournalDraft", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned" },
  {
    model: "JournalSaveOperation",
    policy: "DELETE_WITH_ACCOUNT",
    note: "Operational metadata (no diary content). Unresolved processing → block delete. Completed → delete with account locally.",
  },
  {
    model: "JournalSaveIdempotencyRollout",
    policy: "DELETE_WITH_ACCOUNT",
    note: "Cohort config for actorKey; remove so deleted account cannot retain admission",
  },
  {
    model: "LogHouseDonguriLedgerEntry",
    policy: "POLICY_REQUIRED",
    note: "Accounting trail may need retention; local apply DELETE_WITH_ACCOUNT for disposable fixtures",
  },
  { model: "LogHouseMailboxNotice", policy: "DELETE_WITH_ACCOUNT", note: "profile-scoped notices" },
  { model: "GardenPlant", policy: "DELETE_WITH_ACCOUNT", note: "via email/profile; identity via profile ownership" },
  { model: "GardenDisplayFlower", policy: "DELETE_WITH_ACCOUNT", note: "garden child" },
  { model: "SystemNoticeReadState", policy: "DELETE_WITH_ACCOUNT", note: "read state" },
  { model: "SupportInquiry", policy: "DELETE_WITH_ACCOUNT", note: "user support threads; messages cascade" },
  { model: "Profile", policy: "DELETE_WITH_ACCOUNT", note: "identity-owned P0" },
  { model: "AccountSettings", policy: "DELETE_WITH_ACCOUNT", note: "before AccountIdentity (RESTRICT)" },
  { model: "AccountIdentityLegacyActorClaim", policy: "DELETE_WITH_ACCOUNT", note: "claims" },
  { model: "AccountIdentityEmail", policy: "DELETE_WITH_ACCOUNT", note: "email lifecycle rows" },
  { model: "AccountIdentity", policy: "DELETE_WITH_ACCOUNT", note: "last after RESTRICT deps cleared" },
];

export const JSO_RETENTION_DECISION = {
  policy: "DELETE_AFTER_PENDING_RESOLVED" as const,
  detail:
    "JSO holds operational metadata (fingerprint/status/checkpoint), not diary body. Unresolved status=processing blocks account delete. Completed/failed_final deleted with account on disposable apply.",
};

export const ORDER_VALUE_RETENTION_POLICY = {
  Order: "POLICY_REQUIRED_ANONYMIZE_OR_RETAIN_AUDIT" as const,
  Donguri: "POLICY_REQUIRED_LOCAL_DELETE_WITH_ACCOUNT" as const,
  note: "Legal/business retention is external; app ownership link (identityId) removed/anonymized. No live payment calls.",
};

export type DeleteDryRunRow = {
  model: string;
  count: number;
  policy: DeletePolicy;
  blocking?: boolean;
  detail?: string;
};

export type DeleteDryRunResult = {
  mode: "DRY_RUN";
  identityId: string;
  firebaseUid: string;
  rows: DeleteDryRunRow[];
  blocking: DeleteDryRunRow[];
  canApply: boolean;
};

export type DeleteApplyResult = {
  mode: "APPLY";
  identityId: string;
  deleted: Record<string, number>;
  anonymized: Record<string, number>;
  alreadyDeleted: boolean;
};

async function countOwned(
  prisma: PrismaClient,
  model: string,
  subject: Extract<LifecycleSubject, { state: "BOUND" }>,
): Promise<number> {
  const where = lifecycleOwnedWhere({
    identityId: subject.identityId,
    explicitHistoricalEmails: subject.explicitHistoricalEmails,
  });
  const actorKeys = jsoActorKeysForSubject(subject);

  switch (model) {
    case "JournalEntry":
      return prisma.journalEntry.count({ where: where as never });
    case "JournalDraft":
      return prisma.journalDraft.count({ where: where as never });
    case "DiaryBook":
      return prisma.diaryBook.count({ where: where as never });
    case "DiaryBookshelfBook":
      return prisma.diaryBookshelfBook.count({ where: where as never });
    case "DiaryBookBindingRequest":
      return prisma.diaryBookBindingRequest.count({ where: where as never });
    case "Order":
      return prisma.order.count({ where: where as never });
    case "LogHouseDonguriLedgerEntry":
      return prisma.logHouseDonguriLedgerEntry.count({ where: where as never });
    case "Profile":
      return prisma.profile.count({ where: where as never });
    case "SupportInquiry":
      return prisma.supportInquiry.count({
        where: {
          OR: [
            { identityId: subject.identityId },
            ...(subject.explicitHistoricalEmails.length > 0
              ? [
                  {
                    identityId: null,
                    email: { in: subject.explicitHistoricalEmails },
                  },
                ]
              : []),
          ],
        } as never,
      });
    case "AccountSettings":
      return prisma.accountSettings.count({
        where: { identityId: subject.identityId },
      });
    case "JournalSaveOperation":
      return prisma.journalSaveOperation.count({
        where: { actorKey: { in: actorKeys } },
      });
    case "JournalSaveIdempotencyRollout":
      return prisma.journalSaveIdempotencyRollout.count({
        where: { actorKey: { in: actorKeys } },
      });
    case "KanteiBookBindingRequest": {
      const orders = await prisma.order.findMany({
        where: where as never,
        select: { id: true },
      });
      if (orders.length === 0) return 0;
      return prisma.kanteiBookBindingRequest.count({
        where: { orderId: { in: orders.map((o) => o.id) } },
      });
    }
    case "GardenPlant":
    case "GardenDisplayFlower":
    case "LogHouseMailboxNotice":
    case "SystemNoticeReadState": {
      const emails = subject.explicitHistoricalEmails;
      if (emails.length === 0) return 0;
      if (model === "GardenPlant") {
        return prisma.gardenPlant.count({ where: { email: { in: emails } } });
      }
      if (model === "GardenDisplayFlower") {
        return prisma.gardenDisplayFlower.count({ where: { email: { in: emails } } });
      }
      if (model === "LogHouseMailboxNotice") {
        return prisma.logHouseMailboxNotice.count({ where: { email: { in: emails } } });
      }
      return prisma.systemNoticeReadState.count({ where: { email: { in: emails } } });
    }
    case "AccountIdentityLegacyActorClaim":
      return prisma.accountIdentityLegacyActorClaim.count({
        where: { identityId: subject.identityId },
      });
    case "AccountIdentityEmail":
      return prisma.accountIdentityEmail.count({
        where: { identityId: subject.identityId },
      });
    case "AccountIdentity":
      return prisma.accountIdentity.count({ where: { id: subject.identityId } });
    default:
      return 0;
  }
}

export async function dryRunIdentityAccountDelete(
  prisma: PrismaClient,
  input: { subject?: LifecycleSubject } = {},
): Promise<DeleteDryRunResult | { ok: false; reason: string; state: string }> {
  if (!isIdentityAccountDeleteAuthorityEnabled()) {
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

  const actorKeys = jsoActorKeysForSubject(bound);
  const pendingJso = await prisma.journalSaveOperation.count({
    where: {
      actorKey: { in: actorKeys },
      status: "processing",
    },
  });

  const rows: DeleteDryRunRow[] = [];
  for (const node of ACCOUNT_DELETE_POLICY_GRAPH) {
    const count = await countOwned(prisma, node.model, bound);
    rows.push({
      model: node.model,
      count,
      policy:
        node.model === "Order"
          ? "ANONYMIZE"
          : node.model === "LogHouseDonguriLedgerEntry"
            ? "DELETE_WITH_ACCOUNT"
            : node.policy === "POLICY_REQUIRED"
              ? "DELETE_WITH_ACCOUNT"
              : node.policy,
      detail: node.note,
    });
  }

  const blocking: DeleteDryRunRow[] = [];
  if (pendingJso > 0) {
    blocking.push({
      model: "JournalSaveOperation",
      count: pendingJso,
      policy: "ADMIN_REVIEW_REQUIRED",
      blocking: true,
      detail: "unresolved processing JSO blocks delete",
    });
  }

  return {
    mode: "DRY_RUN",
    identityId: bound.identityId,
    firebaseUid: bound.firebaseUid,
    rows,
    blocking,
    canApply: blocking.length === 0,
  };
}

/**
 * Ordered identity delete APPLY — disposable Postgres only.
 * Does NOT call Firebase. Does NOT touch Neon/Production.
 */
export async function applyIdentityAccountDelete(
  prisma: PrismaClient,
  input: {
    subject: Extract<LifecycleSubject, { state: "BOUND" }>;
    /** When true, anonymize Order instead of delete (local default for POLICY). */
    anonymizeOrders?: boolean;
  },
): Promise<DeleteApplyResult | { ok: false; reason: string }> {
  if (!isIdentityAccountDeleteAuthorityEnabled()) {
    return { ok: false, reason: "gate_off" };
  }

  const dry = await dryRunIdentityAccountDelete(prisma, { subject: input.subject });
  if ("ok" in dry && dry.ok === false) return dry;
  if (!("canApply" in dry) || !dry.canApply) {
    return { ok: false, reason: "blocked_unresolved_operations" };
  }

  const subject = input.subject;
  const where = lifecycleOwnedWhere({
    identityId: subject.identityId,
    explicitHistoricalEmails: subject.explicitHistoricalEmails,
  });
  const actorKeys = jsoActorKeysForSubject(subject);
  const emails = subject.explicitHistoricalEmails;
  const deleted: Record<string, number> = {};
  const anonymized: Record<string, number> = {};

  const existing = await prisma.accountIdentity.findUnique({
    where: { id: subject.identityId },
    select: { id: true },
  });
  if (!existing) {
    return {
      mode: "APPLY",
      identityId: subject.identityId,
      deleted: {},
      anonymized: {},
      alreadyDeleted: true,
    };
  }

  await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: where as never,
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    deleted.KanteiBookBindingRequest = (
      await tx.kanteiBookBindingRequest.deleteMany({
        where: orderIds.length
          ? { orderId: { in: orderIds } }
          : { email: { in: emails.length ? emails : ["__none__"] } },
      })
    ).count;

    deleted.DiaryBookBindingRequest = (
      await tx.diaryBookBindingRequest.deleteMany({ where: where as never })
    ).count;

    if (input.anonymizeOrders !== false) {
      const anon = await tx.order.updateMany({
        where: where as never,
        data: {
          identityId: null,
          email: `deleted+${subject.identityId.slice(0, 8)}@anonymized.invalid`,
          phone: "",
          address: "",
          postalCode: "",
        },
      });
      anonymized.Order = anon.count;
    } else {
      deleted.Order = (
        await tx.order.deleteMany({ where: where as never })
      ).count;
    }

    deleted.DiaryBook = (await tx.diaryBook.deleteMany({ where: where as never })).count;
    deleted.DiaryBookshelfBook = (
      await tx.diaryBookshelfBook.deleteMany({ where: where as never })
    ).count;
    deleted.JournalEntry = (
      await tx.journalEntry.deleteMany({ where: where as never })
    ).count;
    deleted.JournalDraft = (
      await tx.journalDraft.deleteMany({ where: where as never })
    ).count;
    deleted.JournalSaveOperation = (
      await tx.journalSaveOperation.deleteMany({
        where: { actorKey: { in: actorKeys } },
      })
    ).count;
    deleted.JournalSaveIdempotencyRollout = (
      await tx.journalSaveIdempotencyRollout.deleteMany({
        where: { actorKey: { in: actorKeys } },
      })
    ).count;
    deleted.LogHouseDonguriLedgerEntry = (
      await tx.logHouseDonguriLedgerEntry.deleteMany({ where: where as never })
    ).count;

    if (emails.length > 0) {
      deleted.LogHouseMailboxNotice = (
        await tx.logHouseMailboxNotice.deleteMany({ where: { email: { in: emails } } })
      ).count;
      deleted.GardenDisplayFlower = (
        await tx.gardenDisplayFlower.deleteMany({ where: { email: { in: emails } } })
      ).count;
      deleted.GardenPlant = (
        await tx.gardenPlant.deleteMany({ where: { email: { in: emails } } })
      ).count;
      deleted.SystemNoticeReadState = (
        await tx.systemNoticeReadState.deleteMany({ where: { email: { in: emails } } })
      ).count;
    }

    deleted.SupportInquiry = (
      await tx.supportInquiry.deleteMany({
        where: {
          OR: [
            { identityId: subject.identityId },
            ...(emails.length > 0
              ? [{ identityId: null, email: { in: emails } }]
              : []),
          ],
        } as never,
      })
    ).count;

    deleted.Profile = (await tx.profile.deleteMany({ where: where as never })).count;
    deleted.AccountSettings = (
      await tx.accountSettings.deleteMany({ where: { identityId: subject.identityId } })
    ).count;
    deleted.AccountIdentityLegacyActorClaim = (
      await tx.accountIdentityLegacyActorClaim.deleteMany({
        where: { identityId: subject.identityId },
      })
    ).count;
    deleted.AccountIdentityEmail = (
      await tx.accountIdentityEmail.deleteMany({
        where: { identityId: subject.identityId },
      })
    ).count;
    deleted.AccountIdentity = (
      await tx.accountIdentity.deleteMany({ where: { id: subject.identityId } })
    ).count;
  });

  return {
    mode: "APPLY",
    identityId: subject.identityId,
    deleted,
    anonymized,
    alreadyDeleted: false,
  };
}

export function buildStableActorKey(firebaseUid: string): string {
  return buildFirebaseActorKey(firebaseUid);
}

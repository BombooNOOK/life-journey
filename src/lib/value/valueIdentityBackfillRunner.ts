/**
 * AI-X6.7B7B — Donguri + Order identity ownership backfill runner.
 * DRY_RUN / APPLY. Null-only updates. Idempotent second APPLY.
 * Never changes amount / financial fields / receipt email.
 * Caller MUST gate DATABASE_URL to disposable local Postgres.
 */

import type { PrismaClient } from "@prisma/client";

import {
  loadP0BackfillEvidenceFromDb,
  toReportEvidenceSource,
  type P0ReportEvidenceSource,
} from "@/lib/account/p0IdentityOwnershipBackfillApply";
import {
  resolveValueIdentityOwnershipForLegacyRow,
  type ValueBackfillEvidence,
} from "@/lib/value/valueIdentityBackfill";

export type ValueBackfillMode = "DRY_RUN" | "APPLY";

export type ValueBackfillDecisionResult =
  | "BOUND"
  | "ALREADY_BOUND"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "CONFLICT";

export type ValueBackfillDecision = {
  rowAlias: string;
  table: "LogHouseDonguriLedgerEntry" | "Order";
  rowId: string;
  emailHashAlias: string;
  currentIdentityId: string | null;
  proposedIdentityId: string | null;
  result: ValueBackfillDecisionResult;
  evidenceSource: Exclude<P0ReportEvidenceSource, "CURRENT_AUTH_EMAIL_ONLY"> | "IDENTITY_OWNED_PROFILE";
  reason: string;
  /** Ledger amount snapshot for invariant checks (Order: null). */
  amount: number | null;
};

function emailHashAlias(email: string): string {
  let h = 0;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `e${(h >>> 0).toString(16)}`;
}

function toEvidenceSource(
  evidence: ReturnType<typeof resolveValueIdentityOwnershipForLegacyRow>["evidence"],
): ValueBackfillDecision["evidenceSource"] {
  if (evidence === "identity_owned_profile") return "IDENTITY_OWNED_PROFILE";
  const mapped = toReportEvidenceSource(evidence);
  if (mapped === "CURRENT_AUTH_EMAIL_ONLY") return "CONFLICT";
  return mapped;
}

function classifyRow(input: {
  rowAlias: string;
  table: "LogHouseDonguriLedgerEntry" | "Order";
  rowId: string;
  email: string;
  currentIdentityId: string | null;
  amount: number | null;
  proposed: ReturnType<typeof resolveValueIdentityOwnershipForLegacyRow>;
}): ValueBackfillDecision {
  const evidenceSource = toEvidenceSource(input.proposed.evidence);
  if (evidenceSource === "CONFLICT" && input.proposed.evidence === "conflict") {
    // keep
  }

  const proposedId = input.proposed.identityId;

  if (input.currentIdentityId) {
    if (
      input.proposed.class === "BOUND" &&
      proposedId &&
      proposedId === input.currentIdentityId
    ) {
      return {
        rowAlias: input.rowAlias,
        table: input.table,
        rowId: input.rowId,
        emailHashAlias: emailHashAlias(input.email),
        currentIdentityId: input.currentIdentityId,
        proposedIdentityId: proposedId,
        result: "ALREADY_BOUND",
        evidenceSource,
        reason: "already_bound_matches",
        amount: input.amount,
      };
    }
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: input.currentIdentityId,
      proposedIdentityId: proposedId,
      result: "CONFLICT",
      evidenceSource: "CONFLICT",
      reason: proposedId
        ? "existing_identity_conflicts_with_computed"
        : "existing_bind_with_unresolved_proposal",
      amount: input.amount,
    };
  }

  if (input.proposed.class === "BOUND" && proposedId) {
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: null,
      proposedIdentityId: proposedId,
      result: "BOUND",
      evidenceSource,
      reason: input.proposed.reason,
      amount: input.amount,
    };
  }
  if (input.proposed.class === "AMBIGUOUS") {
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: null,
      proposedIdentityId: null,
      result: "AMBIGUOUS",
      evidenceSource: "CONFLICT",
      reason: input.proposed.reason,
      amount: input.amount,
    };
  }
  return {
    rowAlias: input.rowAlias,
    table: input.table,
    rowId: input.rowId,
    emailHashAlias: emailHashAlias(input.email),
    currentIdentityId: null,
    proposedIdentityId: null,
    result: "UNBOUND",
    evidenceSource: "NONE",
    reason: input.proposed.reason,
    amount: input.amount,
  };
}

export async function loadValueBackfillEvidenceFromDb(
  prisma: PrismaClient,
): Promise<ValueBackfillEvidence> {
  const base = await loadP0BackfillEvidenceFromDb(prisma);
  const profiles = await prisma.profile.findMany({
    where: { identityId: { not: null } },
    select: { id: true, identityId: true },
  });
  const profileIdentityById = new Map<string, string>();
  for (const p of profiles) {
    if (p.identityId) profileIdentityById.set(p.id, p.identityId);
  }
  return { ...base, profileIdentityById };
}

export async function runValueCommerceIdentityBackfill(
  prisma: PrismaClient,
  options: {
    mode: ValueBackfillMode;
    emailFilter?: ReadonlySet<string>;
    rowAliases?: ReadonlyMap<string, string>;
  },
): Promise<{
  mode: ValueBackfillMode;
  decisions: ValueBackfillDecision[];
  donguriUpdates: number;
  orderUpdates: number;
  untouched: number;
  /** Σ amount across all scanned ledger rows (unchanged by APPLY). */
  donguriAmountSum: number;
  donguriRowCount: number;
  orderRowCount: number;
}> {
  const evidence = await loadValueBackfillEvidenceFromDb(prisma);
  const ledgers = await prisma.logHouseDonguriLedgerEntry.findMany({
    select: {
      id: true,
      email: true,
      profileId: true,
      identityId: true,
      amount: true,
    },
  });
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      email: true,
      profileId: true,
      identityId: true,
    },
  });

  const filter = options.emailFilter;
  const decisions: ValueBackfillDecision[] = [];
  let donguriAmountSum = 0;

  for (const row of ledgers) {
    const email = row.email.trim().toLowerCase();
    if (filter && !filter.has(email)) continue;
    donguriAmountSum += row.amount;
    const proposed = resolveValueIdentityOwnershipForLegacyRow(
      { email: row.email, profileId: row.profileId },
      evidence,
    );
    decisions.push(
      classifyRow({
        rowAlias:
          options.rowAliases?.get(`Donguri:${row.id}`) ?? `Donguri:${row.id}`,
        table: "LogHouseDonguriLedgerEntry",
        rowId: row.id,
        email: row.email,
        currentIdentityId: row.identityId,
        amount: row.amount,
        proposed,
      }),
    );
  }

  for (const row of orders) {
    const email = row.email.trim().toLowerCase();
    if (filter && !filter.has(email)) continue;
    const proposed = resolveValueIdentityOwnershipForLegacyRow(
      { email: row.email, profileId: row.profileId },
      evidence,
    );
    decisions.push(
      classifyRow({
        rowAlias:
          options.rowAliases?.get(`Order:${row.id}`) ?? `Order:${row.id}`,
        table: "Order",
        rowId: row.id,
        email: row.email,
        currentIdentityId: row.identityId,
        amount: null,
        proposed,
      }),
    );
  }

  let donguriUpdates = 0;
  let orderUpdates = 0;
  let untouched = 0;

  if (options.mode === "APPLY") {
    for (const d of decisions) {
      if (d.result !== "BOUND" || !d.proposedIdentityId) {
        untouched += 1;
        continue;
      }
      if (d.table === "LogHouseDonguriLedgerEntry") {
        const res = await prisma.logHouseDonguriLedgerEntry.updateMany({
          where: { id: d.rowId, identityId: null },
          data: { identityId: d.proposedIdentityId },
        });
        donguriUpdates += res.count;
        if (res.count === 0) untouched += 1;
      } else {
        const res = await prisma.order.updateMany({
          where: { id: d.rowId, identityId: null },
          data: { identityId: d.proposedIdentityId },
        });
        orderUpdates += res.count;
        if (res.count === 0) untouched += 1;
      }
    }
  } else {
    untouched = decisions.filter((d) => d.result !== "BOUND").length;
  }

  const scannedDonguri = decisions.filter(
    (d) => d.table === "LogHouseDonguriLedgerEntry",
  ).length;
  const scannedOrders = decisions.filter((d) => d.table === "Order").length;

  return {
    mode: options.mode,
    decisions,
    donguriUpdates,
    orderUpdates,
    untouched,
    donguriAmountSum,
    donguriRowCount: scannedDonguri,
    orderRowCount: scannedOrders,
  };
}

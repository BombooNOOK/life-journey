/**
 * AI-X6.7B3 — Reusable P0 backfill helper (DRY_RUN / APPLY).
 *
 * Targets: Profile.identityId, JournalEntry.identityId
 * Never overwrites a conflicting non-null identityId (CONFLICT/HOLD).
 * Never uses CURRENT_AUTH_EMAIL_ONLY.
 */

import type { PrismaClient } from "@prisma/client";

import {
  resolveP0IdentityOwnershipForLegacyEmail,
} from "@/lib/account/p0IdentityOwnershipBackfill";
import {
  loadP0BackfillEvidenceFromDb,
  toReportEvidenceSource,
  type P0ReportEvidenceSource,
} from "@/lib/account/p0IdentityOwnershipBackfillApply";

export type P0BackfillMode = "DRY_RUN" | "APPLY";

export type P0BackfillDecisionResult =
  | "BOUND"
  | "ALREADY_BOUND"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "CONFLICT";

export type P0BackfillDecision = {
  rowAlias: string;
  table: "Profile" | "JournalEntry";
  rowId: string;
  /** Opaque alias only — callers should not log raw email. */
  emailHashAlias: string;
  currentIdentityId: string | null;
  proposedIdentityId: string | null;
  result: P0BackfillDecisionResult;
  evidenceSource: Exclude<P0ReportEvidenceSource, "CURRENT_AUTH_EMAIL_ONLY">;
  reason: string;
};

function emailHashAlias(email: string): string {
  // Non-cryptographic short alias for diagnostics — not a secret.
  let h = 0;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `e${(h >>> 0).toString(16)}`;
}

function classifyRow(input: {
  rowAlias: string;
  table: "Profile" | "JournalEntry";
  rowId: string;
  email: string;
  currentIdentityId: string | null;
  proposed: ReturnType<typeof resolveP0IdentityOwnershipForLegacyEmail>;
}): P0BackfillDecision {
  const evidenceSource = toReportEvidenceSource(input.proposed.evidence);
  if (evidenceSource === "CURRENT_AUTH_EMAIL_ONLY") {
    // Defense: never emit forbidden source.
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: input.currentIdentityId,
      proposedIdentityId: null,
      result: "CONFLICT",
      evidenceSource: "CONFLICT",
      reason: "forbidden_current_auth_email_only",
    };
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
      };
    }
    if (
      input.proposed.class === "BOUND" &&
      proposedId &&
      proposedId !== input.currentIdentityId
    ) {
      return {
        rowAlias: input.rowAlias,
        table: input.table,
        rowId: input.rowId,
        emailHashAlias: emailHashAlias(input.email),
        currentIdentityId: input.currentIdentityId,
        proposedIdentityId: proposedId,
        result: "CONFLICT",
        evidenceSource: "CONFLICT",
        reason: "existing_identity_conflicts_with_computed",
      };
    }
    // Existing bind + unresolved computation → HOLD as CONFLICT (no overwrite)
    return {
      rowAlias: input.rowAlias,
      table: input.table,
      rowId: input.rowId,
      emailHashAlias: emailHashAlias(input.email),
      currentIdentityId: input.currentIdentityId,
      proposedIdentityId: proposedId,
      result: "CONFLICT",
      evidenceSource: "CONFLICT",
      reason: "existing_bind_with_unresolved_proposal",
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
  };
}

export async function runP0IdentityOwnershipBackfill(
  prisma: PrismaClient,
  options: {
    mode: P0BackfillMode;
    /** Optional filter: only rows whose email is in this set (normalized). */
    emailFilter?: ReadonlySet<string>;
    rowAliases?: ReadonlyMap<string, string>;
  },
): Promise<{
  mode: P0BackfillMode;
  decisions: P0BackfillDecision[];
  profileUpdates: number;
  journalUpdates: number;
  untouched: number;
}> {
  const evidence = await loadP0BackfillEvidenceFromDb(prisma);
  const profiles = await prisma.profile.findMany({
    select: { id: true, email: true, identityId: true },
  });
  const journals = await prisma.journalEntry.findMany({
    select: { id: true, email: true, identityId: true },
  });

  const filter = options.emailFilter;
  const decisions: P0BackfillDecision[] = [];

  for (const p of profiles) {
    const email = p.email.trim().toLowerCase();
    if (filter && !filter.has(email)) continue;
    const proposed = resolveP0IdentityOwnershipForLegacyEmail(p.email, evidence);
    decisions.push(
      classifyRow({
        rowAlias:
          options.rowAliases?.get(`Profile:${p.id}`) ?? `Profile:${p.id}`,
        table: "Profile",
        rowId: p.id,
        email: p.email,
        currentIdentityId: p.identityId,
        proposed,
      }),
    );
  }
  for (const j of journals) {
    const email = j.email.trim().toLowerCase();
    if (filter && !filter.has(email)) continue;
    const proposed = resolveP0IdentityOwnershipForLegacyEmail(j.email, evidence);
    decisions.push(
      classifyRow({
        rowAlias:
          options.rowAliases?.get(`JournalEntry:${j.id}`) ??
          `JournalEntry:${j.id}`,
        table: "JournalEntry",
        rowId: j.id,
        email: j.email,
        currentIdentityId: j.identityId,
        proposed,
      }),
    );
  }

  let profileUpdates = 0;
  let journalUpdates = 0;
  let untouched = 0;

  if (options.mode === "APPLY") {
    for (const d of decisions) {
      if (d.result !== "BOUND" || !d.proposedIdentityId) {
        untouched += 1;
        continue;
      }
      if (d.table === "Profile") {
        const res = await prisma.profile.updateMany({
          where: { id: d.rowId, identityId: null },
          data: { identityId: d.proposedIdentityId },
        });
        profileUpdates += res.count;
        if (res.count === 0) untouched += 1;
      } else {
        const res = await prisma.journalEntry.updateMany({
          where: { id: d.rowId, identityId: null },
          data: { identityId: d.proposedIdentityId },
        });
        journalUpdates += res.count;
        if (res.count === 0) untouched += 1;
      }
    }
  } else {
    untouched = decisions.filter((d) => d.result !== "BOUND").length;
  }

  return {
    mode: options.mode,
    decisions,
    profileUpdates,
    journalUpdates,
    untouched,
  };
}

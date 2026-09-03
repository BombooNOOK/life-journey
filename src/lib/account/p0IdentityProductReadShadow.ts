/**
 * AI-X6.7B3 — P0 read-shadow for Profile / JournalEntry / AccountSettings.
 * Diagnostic only. User-visible reads remain legacy.
 * Never logs raw email / UID / content / tokens.
 */

import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import {
  buildP0ReadShadowRows,
  type P0ReadShadowCategory,
} from "@/lib/account/p0IdentityOwnershipReadShadow";
import { isP0IdentityReadShadowEnabled } from "@/lib/account/p0IdentityReadShadowGate";
import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";

export type P0ProductReadShadowSurface =
  | "Profile"
  | "JournalEntry"
  | "AccountSettings";

export type P0ProductReadShadowReport = {
  surface: P0ProductReadShadowSurface;
  enabled: boolean;
  ownershipState: P0OwnershipResolution["state"] | "IDENTITY_UNAVAILABLE";
  oldCount: number;
  newCount: number;
  classifications: Record<P0ReadShadowCategory | "IDENTITY_UNAVAILABLE", number>;
  /** Opaque row id hashes only */
  sampleRowHashes: string[];
};

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex").slice(0, 12);
}

function emptyClassifications(): Record<
  P0ReadShadowCategory | "IDENTITY_UNAVAILABLE",
  number
> {
  return {
    MATCH: 0,
    LEGACY_ONLY: 0,
    IDENTITY_ONLY: 0,
    OWNERSHIP_CONFLICT: 0,
    UNBOUND_LEGACY: 0,
    IDENTITY_UNAVAILABLE: 0,
  };
}

export async function observeP0ProductReadShadow(input: {
  surface: P0ProductReadShadowSurface;
  ownership: P0OwnershipResolution;
  /** Legacy email-scoped ids (OLD authority). */
  oldIds: ReadonlyArray<string>;
  db: PrismaClient;
  isEnabled?: () => boolean;
  emit?: (report: P0ProductReadShadowReport) => void;
}): Promise<P0ProductReadShadowReport | null> {
  const enabled = (input.isEnabled ?? isP0IdentityReadShadowEnabled)();
  if (!enabled) return null;

  const classifications = emptyClassifications();

  if (input.ownership.state !== "BOUND" || !input.ownership.identityId) {
    const report: P0ProductReadShadowReport = {
      surface: input.surface,
      enabled: true,
      ownershipState: "IDENTITY_UNAVAILABLE",
      oldCount: input.oldIds.length,
      newCount: 0,
      classifications: {
        ...classifications,
        IDENTITY_UNAVAILABLE: 1,
      },
      sampleRowHashes: input.oldIds.slice(0, 5).map(hashId),
    };
    (input.emit ?? defaultEmit)(report);
    return report;
  }

  const identityId = input.ownership.identityId;
  let newIds: string[] = [];
  const unboundIds = new Set<string>();
  const conflictingIds = new Set<string>();

  if (input.surface === "Profile") {
    const rows = await input.db.profile.findMany({
      where: { identityId },
      select: { id: true },
    });
    newIds = rows.map((r) => r.id);
    // Also inspect OLD set for unbound / conflict metadata
    const oldRows = await input.db.profile.findMany({
      where: { id: { in: [...input.oldIds] } },
      select: { id: true, identityId: true },
    });
    for (const r of oldRows) {
      if (r.identityId == null) unboundIds.add(r.id);
      else if (r.identityId !== identityId) conflictingIds.add(r.id);
    }
  } else if (input.surface === "JournalEntry") {
    const rows = await input.db.journalEntry.findMany({
      where: { identityId },
      select: { id: true },
    });
    newIds = rows.map((r) => r.id);
    const oldRows = await input.db.journalEntry.findMany({
      where: { id: { in: [...input.oldIds] } },
      select: { id: true, identityId: true },
    });
    for (const r of oldRows) {
      if (r.identityId == null) unboundIds.add(r.id);
      else if (r.identityId !== identityId) conflictingIds.add(r.id);
    }
  } else {
    const rows = await input.db.accountSettings.findMany({
      where: { identityId },
      select: { id: true },
    });
    newIds = rows.map((r) => r.id);
    const oldRows = await input.db.accountSettings.findMany({
      where: { id: { in: [...input.oldIds] } },
      select: { id: true, identityId: true },
    });
    for (const r of oldRows) {
      if (r.identityId == null) unboundIds.add(r.id);
      else if (r.identityId !== identityId) conflictingIds.add(r.id);
    }
  }

  const compared = buildP0ReadShadowRows({
    oldIds: input.oldIds,
    newIds,
    unboundIds,
    conflictingIds,
  });
  for (const c of compared) {
    classifications[c.category] += 1;
  }

  const report: P0ProductReadShadowReport = {
    surface: input.surface,
    enabled: true,
    ownershipState: input.ownership.state,
    oldCount: input.oldIds.length,
    newCount: newIds.length,
    classifications,
    sampleRowHashes: [...new Set([...input.oldIds, ...newIds])]
      .slice(0, 8)
      .map(hashId),
  };
  (input.emit ?? defaultEmit)(report);
  return report;
}

function defaultEmit(report: P0ProductReadShadowReport): void {
  console.info(
    "[ljd-p0-read-shadow]",
    JSON.stringify({
      surface: report.surface,
      ownershipState: report.ownershipState,
      oldCount: report.oldCount,
      newCount: report.newCount,
      classifications: report.classifications,
      sampleRowHashes: report.sampleRowHashes,
    }),
  );
}

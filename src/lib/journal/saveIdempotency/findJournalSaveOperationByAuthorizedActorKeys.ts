/**
 * SELECT-only multi-actorKey JournalSaveOperation recovery lookup (AI-X6.4).
 *
 * Exact saveOperationId + actorKey IN authorized set.
 * 0 → not_found, 1 → found, 2+ → ambiguous (fail closed; never pick).
 *
 * Does not mutate rows. Does not expose actorKeys to callers' public layer.
 */

import type { PrismaClient } from "@prisma/client";

export type JournalSaveRecoveryLookupRow = {
  status: string;
  journalEntryId: string | null;
  requestFingerprint: string;
  resultCode: string | null;
};

export type FindJournalSaveOperationByAuthorizedActorKeysResult =
  | { kind: "not_found" }
  | { kind: "found"; row: JournalSaveRecoveryLookupRow }
  | { kind: "ambiguous"; matchCount: number };

function dedupeActorKeys(actorKeys: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of actorKeys) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Find at most enough rows to detect ambiguity for one saveOperationId
 * across an authorized actorKey set.
 */
export async function findJournalSaveOperationByAuthorizedActorKeys(
  client: Pick<PrismaClient, "journalSaveOperation">,
  input: {
    actorKeys: ReadonlyArray<string>;
    saveOperationId: string;
  },
): Promise<FindJournalSaveOperationByAuthorizedActorKeysResult> {
  const actorKeys = dedupeActorKeys(input.actorKeys);
  if (actorKeys.length === 0 || !input.saveOperationId) {
    return { kind: "not_found" };
  }

  // Fetch up to 2 to distinguish found vs ambiguous without loading all history.
  const rows = await client.journalSaveOperation.findMany({
    where: {
      saveOperationId: input.saveOperationId,
      actorKey: { in: actorKeys },
    },
    select: {
      status: true,
      journalEntryId: true,
      requestFingerprint: true,
      resultCode: true,
    },
    take: 2,
  });

  if (rows.length === 0) {
    return { kind: "not_found" };
  }
  if (rows.length >= 2) {
    return { kind: "ambiguous", matchCount: rows.length };
  }

  const row = rows[0]!;
  return {
    kind: "found",
    row: {
      status: row.status,
      journalEntryId: row.journalEntryId,
      requestFingerprint: row.requestFingerprint,
      resultCode: row.resultCode,
    },
  };
}

/**
 * Prisma-backed JournalSaveOperation store (4B-4P/U).
 * Domain stays free of Prisma; this adapter maps userId ↔ actorKey.
 * Requires official migration `20260813140000_add_journal_save_operation` on target DB.
 * Not wired to production POST /api/journal.
 */

import type { PrismaClient } from "@prisma/client";

import type {
  JournalSaveOperationCheckpoint,
  JournalSaveOperationRecord,
  JournalSaveOperationResultCode,
  JournalSaveOperationStatus,
  JournalSaveOperationStore,
  SaveOperationId,
} from "@/lib/journal/saveIdempotency/types";

function toIso(d: Date): string {
  return d.toISOString();
}

function mapRow(row: {
  id: string;
  actorKey: string;
  saveOperationId: string;
  status: string;
  checkpoint: string;
  journalEntryId: string | null;
  requestFingerprint: string;
  resultCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): JournalSaveOperationRecord {
  return {
    id: row.id,
    userId: row.actorKey,
    saveOperationId: row.saveOperationId,
    status: row.status as JournalSaveOperationStatus,
    checkpoint: row.checkpoint as JournalSaveOperationCheckpoint,
    journalEntryId: row.journalEntryId,
    requestFingerprint: row.requestFingerprint,
    resultCode: row.resultCode as JournalSaveOperationResultCode,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    completedAt: row.completedAt ? toIso(row.completedAt) : null,
  };
}

function newId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `op_${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function createPrismaJournalSaveOperationStore(
  client: PrismaClient,
): JournalSaveOperationStore {
  return {
    async findByUserAndOperationId(userId, saveOperationId) {
      const row = await client.journalSaveOperation.findUnique({
        where: {
          actorKey_saveOperationId: {
            actorKey: userId,
            saveOperationId,
          },
        },
      });
      return row ? mapRow(row) : null;
    },

    async tryInsertClaim(row) {
      const id = row.id ?? newId();
      try {
        const created = await client.journalSaveOperation.create({
          data: {
            id,
            actorKey: row.userId,
            saveOperationId: row.saveOperationId,
            status: row.status,
            checkpoint: row.checkpoint,
            journalEntryId: row.journalEntryId,
            requestFingerprint: row.requestFingerprint,
            resultCode: row.resultCode,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            completedAt: row.completedAt ? new Date(row.completedAt) : null,
          },
        });
        return { created: true, row: mapRow(created) };
      } catch (error) {
        // Unique violation → loser observes existing row
        const existing = await client.journalSaveOperation.findUnique({
          where: {
            actorKey_saveOperationId: {
              actorKey: row.userId,
              saveOperationId: row.saveOperationId,
            },
          },
        });
        if (existing) {
          return { created: false, row: mapRow(existing) };
        }
        throw error;
      }
    },

    async update(row) {
      const updated = await client.journalSaveOperation.update({
        where: { id: row.id },
        data: {
          status: row.status,
          checkpoint: row.checkpoint,
          journalEntryId: row.journalEntryId,
          requestFingerprint: row.requestFingerprint,
          resultCode: row.resultCode,
          updatedAt: new Date(row.updatedAt),
          completedAt: row.completedAt ? new Date(row.completedAt) : null,
        },
      });
      return mapRow(updated);
    },

    async compareAndSet(input) {
      const patch = input.patch;
      const data: Record<string, unknown> = {
        updatedAt: patch.updatedAt
          ? new Date(patch.updatedAt)
          : new Date(),
      };
      if (patch.status !== undefined) data.status = patch.status;
      if (patch.checkpoint !== undefined) data.checkpoint = patch.checkpoint;
      if (patch.journalEntryId !== undefined) {
        data.journalEntryId = patch.journalEntryId;
      }
      if (patch.requestFingerprint !== undefined) {
        data.requestFingerprint = patch.requestFingerprint;
      }
      if (patch.resultCode !== undefined) data.resultCode = patch.resultCode;
      if (patch.completedAt !== undefined) {
        data.completedAt = patch.completedAt
          ? new Date(patch.completedAt)
          : null;
      }

      const where: {
        actorKey: string;
        saveOperationId: SaveOperationId;
        checkpoint: JournalSaveOperationCheckpoint;
        journalEntryId?: string | null;
      } = {
        actorKey: input.userId,
        saveOperationId: input.saveOperationId,
        checkpoint: input.expectedCheckpoint,
      };
      if (input.expectedJournalEntryId !== undefined) {
        where.journalEntryId = input.expectedJournalEntryId;
      }

      const result = await client.journalSaveOperation.updateMany({
        where,
        data,
      });
      const current = await client.journalSaveOperation.findUnique({
        where: {
          actorKey_saveOperationId: {
            actorKey: input.userId,
            saveOperationId: input.saveOperationId,
          },
        },
      });
      if (result.count === 1 && current) {
        return { ok: true, row: mapRow(current) };
      }
      return { ok: false, row: current ? mapRow(current) : null };
    },
  };
}

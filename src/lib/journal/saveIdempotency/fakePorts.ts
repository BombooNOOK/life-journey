/**
 * Test / harness fakes for journal save side effects.
 * Mirrors production semantics at a coarse level:
 * - create always new id unless tests inject
 * - photo applies to entry map (overwrite)
 * - donguri dedup by journalEntryId (entry:{id})
 */

import type {
  JournalSaveSideEffectPorts,
  SaveOperationId,
} from "@/lib/journal/saveIdempotency/types";

export type FakeJournalWorld = {
  entries: Map<string, { userId: string; entryDate: string; photo: boolean }>;
  /** journalEntryId → charged once */
  donguriChargedEntryIds: Set<string>;
  createCount: number;
  photoApplyCount: number;
  chargeAttempts: number;
  chargeSuccessCount: number;
  deleteCount: number;
  insufficientBalance: boolean;
};

export function createFakeJournalWorld(
  options?: { insufficientBalance?: boolean },
): FakeJournalWorld {
  return {
    entries: new Map(),
    donguriChargedEntryIds: new Set(),
    createCount: 0,
    photoApplyCount: 0,
    chargeAttempts: 0,
    chargeSuccessCount: 0,
    deleteCount: 0,
    insufficientBalance: options?.insufficientBalance ?? false,
  };
}

export function createFakeSavePorts(
  world: FakeJournalWorld,
  options?: { createRowId?: () => string; now?: () => string },
): JournalSaveSideEffectPorts {
  let entrySeq = 0;
  return {
    now: options?.now,
    createRowId: options?.createRowId,
    async createJournalEntry(input: {
      userId: string;
      entryDate: string;
      saveOperationId: SaveOperationId;
    }) {
      world.createCount += 1;
      const journalEntryId = `entry_${++entrySeq}_${input.saveOperationId.slice(0, 8)}`;
      world.entries.set(journalEntryId, {
        userId: input.userId,
        entryDate: input.entryDate,
        photo: false,
      });
      return { journalEntryId };
    },
    async applyPhoto(input) {
      world.photoApplyCount += 1;
      const e = world.entries.get(input.journalEntryId);
      if (!e) throw new Error("entry_missing_for_photo");
      world.entries.set(input.journalEntryId, {
        ...e,
        photo: input.hasPhoto,
      });
    },
    async chargeDonguri(input) {
      world.chargeAttempts += 1;
      if (world.donguriChargedEntryIds.has(input.journalEntryId)) {
        return { charged: false, alreadyCharged: true, insufficient: false };
      }
      if (world.insufficientBalance) {
        return { charged: false, alreadyCharged: false, insufficient: true };
      }
      world.donguriChargedEntryIds.add(input.journalEntryId);
      world.chargeSuccessCount += 1;
      return { charged: true, alreadyCharged: false, insufficient: false };
    },
    async deleteJournalEntry(journalEntryId) {
      world.deleteCount += 1;
      world.entries.delete(journalEntryId);
    },
  };
}

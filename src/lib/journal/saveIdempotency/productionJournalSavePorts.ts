/**
 * Production side-effect ports for journal save idempotency (4B-4Y).
 * Mirrors POST /api/journal create → photo → donguri charge semantics.
 * Donguri dedup remains entry:{journalEntryId} via chargeDiarySaveAcorns.
 */

import { Prisma } from "@prisma/client";

import { resolveP0JournalCreateIdentityFields } from "@/lib/account/p0IdentityWriteFields";
import { prisma } from "@/lib/db";
import type { JournalSaveSideEffectPorts } from "@/lib/journal/saveIdempotency/types";
import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import {
  buildJournalGeneratedComment,
} from "@/lib/journal/kanteiCommentEligibility";
import { deleteJournalDraft, transferJournalDraftPhotoToEntry } from "@/lib/journal/journalDrafts";
import { journalEntryDateToIsoDateInput } from "@/lib/journal/referenceDateParts";
import {
  resolveJournalEntryPhotoDbFields,
  type PhotoPatchFromClient,
} from "@/lib/journal/journalEntryPhotoPersist";
import { chargeDiarySaveAcorns } from "@/lib/loghouse/donguriLedger";

export type ProductionJournalSavePortContext = {
  viewerEmail: string;
  profileId: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  includeInBook: boolean;
  parsedEntryDate: Date;
  photoPatch: PhotoPatchFromClient;
};

function isDesignThemeValidationError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientValidationError)) return false;
  return /designTheme/.test(error.message);
}

const entrySelect = {
  id: true,
  content: true,
  createdAt: true,
  mood: true,
  activity: true,
  companionType: true,
  designTheme: true,
  contentFontMode: true,
  photoDataUrl: true,
  photoBlobUrl: true,
  photoBlobPathname: true,
  photoMimeType: true,
  photoSizeBytes: true,
  photoStorageProvider: true,
  generatedComment: true,
  includeInBook: true,
} as const;

export function createProductionJournalSavePorts(
  ctx: ProductionJournalSavePortContext,
): JournalSaveSideEffectPorts {
  return {
    async createJournalEntry() {
      const recentRows = await prisma.journalEntry.findMany({
        where: { email: ctx.viewerEmail, profileId: ctx.profileId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { generatedComment: true },
      });
      const recentTemplateIds = recentRows.flatMap((row) =>
        collectTemplateIdsFromReadingText(row.generatedComment ?? ""),
      );
      const generatedComment = await buildJournalGeneratedComment({
        viewerEmail: ctx.viewerEmail,
        profileId: ctx.profileId,
        activity: ctx.activity,
        mood: ctx.mood,
        companionType: ctx.companionType,
        referenceDate: ctx.parsedEntryDate,
        recentTemplateIds,
      });
      const emptyPhoto = {
        photoDataUrl: null,
        photoBlobUrl: null,
        photoBlobPathname: null,
        photoMimeType: null,
        photoSizeBytes: null,
        photoStorageProvider: null,
      };
      try {
        const identityFields = await resolveP0JournalCreateIdentityFields({
          profileId: ctx.profileId,
        });
        if ("forbidden" in identityFields) {
          throw new Error("p0_journal_create_forbidden_profile");
        }
        const entry = await prisma.journalEntry.create({
          data: {
            email: ctx.viewerEmail,
            profileId: ctx.profileId,
            content: ctx.content,
            createdAt: ctx.parsedEntryDate,
            mood: ctx.mood,
            activity: ctx.activity,
            companionType: ctx.companionType,
            designTheme: ctx.designTheme,
            contentFontMode: ctx.contentFontMode,
            ...emptyPhoto,
            generatedComment,
            includeInBook: ctx.includeInBook,
            ...identityFields,
          },
          select: { id: true },
        });
        return { journalEntryId: entry.id };
      } catch (error) {
        if (!isDesignThemeValidationError(error)) throw error;
        const identityFields = await resolveP0JournalCreateIdentityFields({
          profileId: ctx.profileId,
        });
        if ("forbidden" in identityFields) {
          throw new Error("p0_journal_create_forbidden_profile");
        }
        const entry = await prisma.journalEntry.create({
          data: {
            email: ctx.viewerEmail,
            profileId: ctx.profileId,
            content: ctx.content,
            createdAt: ctx.parsedEntryDate,
            mood: ctx.mood,
            activity: ctx.activity,
            companionType: ctx.companionType,
            contentFontMode: ctx.contentFontMode,
            ...emptyPhoto,
            generatedComment,
            includeInBook: ctx.includeInBook,
            ...identityFields,
          },
          select: { id: true },
        });
        return { journalEntryId: entry.id };
      }
    },

    async applyPhoto(input) {
      const draftDateKey = journalEntryDateToIsoDateInput(ctx.parsedEntryDate);
      if (ctx.photoPatch.kind === "set") {
        const photoDbFields = await resolveJournalEntryPhotoDbFields({
          patch: ctx.photoPatch,
          existing: null,
          profileId: ctx.profileId,
          entryId: input.journalEntryId,
        });
        await prisma.journalEntry.update({
          where: { id: input.journalEntryId },
          data: photoDbFields,
          select: { id: true },
        });
        return;
      }
      const entry = await prisma.journalEntry.findUnique({
        where: { id: input.journalEntryId },
        select: {
          photoBlobUrl: true,
          photoDataUrl: true,
        },
      });
      if (
        entry &&
        draftDateKey &&
        ctx.photoPatch.kind !== "remove" &&
        !entry.photoBlobUrl &&
        !entry.photoDataUrl
      ) {
        await transferJournalDraftPhotoToEntry({
          email: ctx.viewerEmail,
          profileId: ctx.profileId,
          dateKey: draftDateKey,
          entryId: input.journalEntryId,
        });
      }
    },

    async chargeDonguri(input) {
      const charge = await chargeDiarySaveAcorns({
        email: ctx.viewerEmail,
        profileId: ctx.profileId,
        journalEntryId: input.journalEntryId,
      });
      if (charge.insufficient) {
        return { charged: false, alreadyCharged: false, insufficient: true };
      }
      if (charge.alreadyCharged) {
        return { charged: false, alreadyCharged: true, insufficient: false };
      }
      const draftDateKey = journalEntryDateToIsoDateInput(ctx.parsedEntryDate);
      if (draftDateKey) {
        await deleteJournalDraft({
          email: ctx.viewerEmail,
          profileId: ctx.profileId,
          dateKey: draftDateKey,
        });
      }
      return { charged: true, alreadyCharged: false, insufficient: false };
    },

    async deleteJournalEntry(journalEntryId) {
      await prisma.journalEntry.delete({ where: { id: journalEntryId } }).catch(() => undefined);
    },
  };
}

export { entrySelect };

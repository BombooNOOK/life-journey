import { collectTemplateIdsFromReadingText } from "@/lib/diary-reading/generateDiaryReading";
import { buildDiaryReadingFromJournalInput } from "@/lib/diary-reading/fromJournal";
import { normalizeJournalCommentText } from "@/lib/journal/comment";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";

export { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE };

export async function profileHasKanteiOrder(
  viewerEmail: string,
  profileId: string,
): Promise<boolean> {
  const order = await findKanteiOrderForProfile({ viewerEmail, profileId });
  return order != null;
}

type BuildJournalGeneratedCommentParams = {
  viewerEmail: string;
  profileId: string;
  activity: string;
  mood: string;
  companionType?: string;
  referenceDate: Date;
  recentTemplateIds?: string[];
  existingComment?: string | null;
  preserveDiaryReading?: boolean;
};

/**
 * プロフィールに鑑定書（Order）があるときだけフクロウ先生コメントを生成する。
 * 未鑑定のときは null（DB にも保存しない想定）。
 */
export async function buildJournalGeneratedComment(
  params: BuildJournalGeneratedCommentParams,
): Promise<string | null> {
  const order = await findKanteiOrderForProfile({
    viewerEmail: params.viewerEmail,
    profileId: params.profileId,
  });
  if (!order) {
    return null;
  }

  if (
    params.preserveDiaryReading &&
    params.existingComment != null &&
    params.existingComment.trim() !== ""
  ) {
    return normalizeJournalCommentText(params.existingComment);
  }

  return normalizeJournalCommentText(
    buildDiaryReadingFromJournalInput({
      activity: params.activity,
      mood: params.mood,
      companionType: params.companionType,
      referenceDate: params.referenceDate,
      birthMonth: order.birthMonth,
      birthDay: order.birthDay,
      recentTemplateIds: params.recentTemplateIds,
    }).text,
  );
}

export function sanitizeJournalCommentForResponse(
  generatedComment: string | null | undefined,
  _kanteiOrderExists: boolean,
): string | null {
  if (generatedComment == null || generatedComment === "") return null;
  return normalizeJournalCommentText(generatedComment);
}

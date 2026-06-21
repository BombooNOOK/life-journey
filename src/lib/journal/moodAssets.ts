import { isMoodId, type MoodId } from "@/lib/journal/meta";

const MOOD_OWL_ICON_CACHE_VERSION = "2";

/** moodId → フクロウ先生の気分アイコン PNG（public/images） */
export const MOOD_OWL_ICON_FILE_BY_ID: Record<MoodId, string> = {
  happy: "mood-happy-owl.png",
  normal: "mood-normal-owl.png",
  calm: "mood-calm-owl.png",
  tired: "mood-tired-owl.png",
  moody: "mood-worried-owl.png",
};

export function moodOwlIconFilename(moodId: string): string {
  return isMoodId(moodId) ? MOOD_OWL_ICON_FILE_BY_ID[moodId] : MOOD_OWL_ICON_FILE_BY_ID.calm;
}

/** Web・プレビュー用（キャッシュバスター付き） */
export function moodOwlIconImagePath(moodId: string): string {
  return `/images/${moodOwlIconFilename(moodId)}?v=${MOOD_OWL_ICON_CACHE_VERSION}`;
}

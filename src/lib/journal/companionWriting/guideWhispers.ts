import type { CompanionType } from "@/lib/journal/meta";
import { normalizeCompanionType, getCompanionLabel } from "@/lib/journal/meta";

/** カレンダー完了カード2：選んだ鑑定士の短いひとこと */
const CALENDAR_SAVE_WHISPER: Record<CompanionType, string> = {
  owl: "今日の1ページ、受け取りましたよ。",
  hedgehog: "今日の1ページ、ちゃんと受け取りましたよ。",
  squirrel: "今日の1ページ、受け取りました！",
  sloth: "今日の1ページ、のんびり受け取りました。",
  frog: "今日の1ページ、ちゃんと受け取りました。",
};

/** 編集画面ガイド：選んだ鑑定士の短いひとこと */
const EDIT_GUIDE_WHISPER: Record<CompanionType, string> = {
  owl: "あとから足すことばも、今日の大切なあしあとです。",
  hedgehog: "あとから足すことばも、ちゃんと意味がありますよ。",
  squirrel: "あとから足すことばも、今日の宝物になりますよ！",
  sloth: "あとから足すことばも、ゆっくり効いてきます。",
  frog: "あとから足すことばも、今日の大切なあしあとです。",
};

export function getCompanionWritingCalendarWhisper(companionType: string): {
  name: string;
  message: string;
} {
  const id = normalizeCompanionType(companionType);
  return {
    name: getCompanionLabel(id),
    message: CALENDAR_SAVE_WHISPER[id],
  };
}

export function getCompanionWritingEditGuideWhisper(companionType: string): {
  name: string;
  message: string;
} {
  const id = normalizeCompanionType(companionType);
  return {
    name: getCompanionLabel(id),
    message: EDIT_GUIDE_WHISPER[id],
  };
}

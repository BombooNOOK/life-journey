import type { CompanionType } from "@/lib/journal/meta";
import { normalizeCompanionType, getCompanionLabel } from "@/lib/journal/meta";

/** カレンダー完了カード2：選んだ鑑定士の短いひとこと */
const CALENDAR_SAVE_WHISPER: Record<CompanionType, string> = {
  owl: "今日の1ページ、静かに森に届きました。",
  hedgehog: "今日の1ページ、ちゃんと残りましたよ。",
  squirrel: "今日の1ページ、森に届きました！",
  sloth: "今日の1ページ、のんびり森に届きました。",
  frog: "今日の1ページ、ちゃんと森に届きました。",
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

import type { ActivityId, CompanionType, MoodId } from "@/lib/journal/meta";

export const COMPANION_WRITING_FORMAL_TITLE = "どうぶつ鑑定士といっしょに書く";

export type CompanionWritingWizardStep =
  | "companion"
  | "mood"
  | "activity"
  | "write";

export const COMPANION_WRITING_ACTIVITY_HEADING = "今日はどんな1日でしたか？";

export const COMPANION_WRITING_APPRAISER_HEADING =
  "どのどうぶつ鑑定士の話を聞きますか？";

export const COMPANION_WRITING_APPRAISER_HEADING_SHORT = "どうぶつ鑑定士を選ぶ";

export const COMPANION_WRITING_APPRAISER_DESCRIPTION =
  "今日の気分に合わせて、話を聞いてみたいどうぶつ鑑定士を選んでください。";

/** 伴走ウィザード最初の画面：案内役選択 */
export const COMPANION_WRITING_APPRAISER_PICK_HEADING = "今日の案内役を選ぶ";

export const COMPANION_WRITING_APPRAISER_PICK_HINT =
  "気になる鑑定士をひとり選んでください。";

/** 伴走ウィザード：気分選択 */
export const COMPANION_WRITING_MOOD_PICK_HEADING = "今日の気分をえらぶ";

/** 伴走ウィザード：日記入力 */
export const COMPANION_WRITING_WRITE_HEADING = "あなたの言葉で残してみてください";

export const COMPANION_WRITING_WRITE_HINT = "短くても大丈夫です";

export const COMPANION_WRITING_OMAKASE_LABEL = "おまかせ";

export const COMPANION_WRITING_CALENDAR_GUIDE_TITLE = "ここに、今日のあしあとが残りました";

export const COMPANION_WRITING_CALENDAR_GUIDE_BODY =
  "カレンダーに、今日のしるしがつきました。あとからいつでも、この日のページを見返せます。";

export const COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL = "つぎへ";

/** 足あと確認：カレンダー全画面表示の秒数 */
export const COMPANION_WRITING_CALENDAR_REVEAL_MS = 3000;

/** 森への届け演出：合計表示秒数（3枚×1秒） */
export const COMPANION_WRITING_FOREST_DELIVERY_MS = 3000;

export const COMPANION_SAVE_FOREST_FRAME_PATHS = [
  "/images/ljd/companion-save/companion_save_forest_01_book_start.png",
  "/images/ljd/companion-save/companion_save_forest_02_book_flying.png",
  "/images/ljd/companion-save/companion_save_forest_03_book_arrived.png",
] as const;

/** 完了カードのメイン文言 */
export const COMPANION_WRITING_COMPLETE_CARD_MESSAGE = "今日の1ページ、森に届きました！";

/** 伴走保存〜カレンダー表示までのフクロウ文言 */
export const COMPANION_WRITING_SAVE_LOADING_LABEL =
  "フクロウ先生が日記のあしあとを確認しています…";

/** 森への届け演出カード内テキスト */
export const COMPANION_WRITING_FOREST_DELIVERY_CARD_TEXT =
  "今日の1ページが、森へ向かっています…";

/** カレンダー表示中の仮ギミック文言（本番用は後で差し替え可） */
export const COMPANION_WRITING_CALENDAR_REVEAL_STATUS =
  "カレンダーに、今日のしるしがのこりました";

/** 伴走完了ガイドの URL クエリ（ブラウザ戻るとフェーズ同期） */
export const COMPANION_WRITING_CALENDAR_GUIDE_QUERY = "cwGuide";

export type CompanionWritingCalendarGuidePhase =
  | "intro"
  | "calendar"
  | "forest"
  | "actions";

export function parseCompanionWritingCalendarGuidePhase(
  value: string | null,
): CompanionWritingCalendarGuidePhase | null {
  if (value === "intro") return "calendar";
  if (value === "calendar" || value === "forest" || value === "actions") return value;
  return null;
}

/** @deprecated use COMPANION_WRITING_CALENDAR_GUIDE_TITLE */
export const COMPANION_WRITING_CALENDAR_COMPLETE_TITLE = COMPANION_WRITING_CALENDAR_GUIDE_TITLE;

/** @deprecated use COMPANION_WRITING_CALENDAR_GUIDE_BODY */
export const COMPANION_WRITING_CALENDAR_COMPLETE_BODY = COMPANION_WRITING_CALENDAR_GUIDE_BODY;

export const COMPANION_WRITING_JOURNAL_GUIDE_TITLE = "今日のページを、もう少し育てられます";

export const COMPANION_WRITING_JOURNAL_GUIDE_BODY =
  "写真を残すなら、写真エリアへ。ことばを足すなら、本文エリアへ。";

export const COMPANION_WRITING_ZONE_PHOTO_LABEL = "ここから写真を追加できます";

export const COMPANION_WRITING_ZONE_BODY_LABEL = "ここに、ことばを足せます";

export const COMPANION_WRITING_JOURNAL_GUIDE_DISMISS_LABEL = "わかりました";

export const COMPANION_WRITING_FAREWELL_MESSAGE =
  "今日のページは、森にそっと残りました。また書きたくなった日に、ここへ戻ってきてください。";


export type CompanionWritingDraft = {
  mood: MoodId;
  companionType: CompanionType;
  activity: ActivityId;
  companionName: string;
  companionShortLine: string;
  userAnswer: string;
};

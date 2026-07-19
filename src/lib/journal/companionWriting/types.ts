import type { ActivityId, CompanionType, MoodId } from "@/lib/journal/meta";

export const COMPANION_WRITING_FORMAL_TITLE = "どうぶつ鑑定士といっしょに書く";

export type CompanionWritingWizardStep =
  | "companion"
  | "mood"
  | "activity"
  | "write"
  | "confirm";

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

/** 伴走ウィザード：質問穴埋め（鑑定士名を差し込む） */
export function companionWritingQuestionsHeading(companionName: string): string {
  const name = companionName.trim() || "今日の案内役";
  return `${name}からの質問に答えてみてください`;
}

export const COMPANION_WRITING_QUESTIONS_HINT = "単語や短い文で大丈夫です。";

/** 伴走ウィザード：保存前確認 */
export const COMPANION_WRITING_CONFIRM_HEADING = "こんな感じで残しますか？";

export const COMPANION_WRITING_OMAKASE_LABEL = "おまかせ";

export const COMPANION_WRITING_CALENDAR_GUIDE_TITLE = "ここに、今日のあしあとが残りました";

export const COMPANION_WRITING_CALENDAR_GUIDE_BODY =
  "カレンダーに、今日のしるしがつきました。あとからいつでも、この日のページを見返せます。";

export const COMPANION_WRITING_CALENDAR_GUIDE_NEXT_LABEL = "つぎへ";

/** 足あと確認：カレンダー全画面表示の秒数 */
export const COMPANION_WRITING_CALENDAR_REVEAL_MS = 3000;

/** 届け演出：合計表示秒数（3枚×1秒） */
export const COMPANION_WRITING_FOREST_DELIVERY_MS = 3000;

export const COMPANION_SAVE_FOREST_FRAME_PATHS = [
  "/images/ljd/companion-save/companion_save_forest_01_book_start.png?v=2",
  "/images/ljd/companion-save/companion_save_forest_02_book_flying.png?v=2",
  "/images/ljd/companion-save/companion_save_forest_03_book_arrived.png?v=2",
] as const;

/** 完了カードのメイン文言 */
export const COMPANION_WRITING_COMPLETE_CARD_MESSAGE = "今日の1ページ、受け取りましたよ";

export const COMPANION_WRITING_COMPLETE_GROW_LABEL = "今日のページをもう少し育てる";

export const COMPANION_WRITING_COMPLETE_FINISH_LABEL = "確認しておしまい";

/** 伴走保存〜カレンダー表示までの確認文言（鑑定士名を差し込む） */
export function companionWritingSaveLoadingLabel(companionName: string): string {
  const name = companionName.trim() || "案内役";
  return `${name}が日記のあしあとを確認しています…`;
}

/** 届け演出：飛行中（鑑定のへやへ） */
export const COMPANION_WRITING_FOREST_DELIVERY_CARD_TEXT =
  "今日の1ページが、鑑定のへやに向かっています…";

/** 届け演出：到着（選んだ鑑定士の受け取り） */
export function companionWritingForestDeliveryArrivedText(companionName: string): string {
  const name = companionName.trim() || "案内役";
  return `今日の1ページ、受け取りましたよ\n${name}より`;
}

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

/** スポットライト表示中の案内（やや大きめ） */
export const COMPANION_WRITING_ZONE_PHOTO_SPOTLIGHT_LABEL =
  "ここから、思い出の写真を選べます";

export const COMPANION_WRITING_ZONE_BODY_SPOTLIGHT_LABEL = "ここに、ことばを足せます";

/** 伴走編集ドック：保存してプレビューへ */
export const COMPANION_WRITING_EDIT_FINISH_LABEL = "今日の1ページを見ておしまい";

/** 伴走編集ゾーンのスポットライト表示秒数 */
export const COMPANION_WRITING_EDIT_ZONE_SPOTLIGHT_MS = 3200;

export const COMPANION_WRITING_JOURNAL_GUIDE_DISMISS_LABEL = "わかりました";

export const COMPANION_WRITING_FAREWELL_MESSAGE =
  "今日のページは、そっと残りました。また書きたくなった日に、ここへ戻ってきてください。";

/** 伴走プレビュー：最下部到達後の案内（1枚目） */
export const COMPANION_WRITING_PREVIEW_GUIDE_READ_TITLE = "書いた記録は、いつでも見返せます";

export const COMPANION_WRITING_PREVIEW_GUIDE_READ_BODY =
  "下のメニュー「あしあと帳」や、ログハウスの本棚から、今日のページをまた開けます。";

/** 伴走プレビュー：最下部到達後の案内（2枚目） */
export const COMPANION_WRITING_PREVIEW_GUIDE_WRITE_TITLE = "また書きたくなったら";

export const COMPANION_WRITING_PREVIEW_GUIDE_WRITE_BODY =
  "「日記を書く」や「どうぶつ鑑定士といっしょに書く」から、いつでも新しい記録を始められます。";

export const COMPANION_WRITING_PREVIEW_GUIDE_CLOSING = "また会えるのを、楽しみにしているね。";

export const COMPANION_WRITING_PREVIEW_GUIDE_FINISH_LABEL = "トップへ";


export type CompanionWritingDraft = {
  mood: MoodId;
  companionType: CompanionType;
  activity: ActivityId;
  companionName: string;
  companionShortLine: string;
  generatedBody: string;
};

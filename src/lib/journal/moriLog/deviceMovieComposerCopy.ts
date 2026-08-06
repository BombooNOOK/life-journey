/**
 * 端末動画→森の映写便り作成フローの表示文言・エラー変換。
 */

import type { MoriLogDeviceMovieErrorCode } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";

export const DEVICE_MOVIE_TEMPLATE_ID = "device_movie_basic" as const;
/** 利用者向け作品名 */
export const DEVICE_MOVIE_TEMPLATE_LABEL = "森の映写便り" as const;
/** 作成画面の見出し */
export const DEVICE_MOVIE_PAGE_TITLE = "森の映写便りをつくる" as const;
export const DEVICE_MOVIE_DEFAULT_TITLE = "森のひとこま" as const;
export const DEVICE_MOVIE_TITLE_MAX_CHARS = 16;

export const DEVICE_MOVIE_STEP1_TITLE = "心に残したい動画を選びましょう";
export const DEVICE_MOVIE_STEP1_HINT =
  "動画の中から、心に残った3秒から10秒を選び、森の映写便りに仕立てます。";

export const DEVICE_MOVIE_STEP2_TITLE = "残したい一場面を選びましょう";
export const DEVICE_MOVIE_STEP2_HINT =
  "使う長さは3〜10秒です。大切な瞬間がすっぽり収まるよう、始まりをずらして調整できます。";

export const DEVICE_MOVIE_STEP3_TITLE = "音を選びましょう";
export const DEVICE_MOVIE_AUDIO_ORIGINAL = "動画の音を使う";
export const DEVICE_MOVIE_AUDIO_BGM = "森の音楽をつける";
export const DEVICE_MOVIE_AUDIO_MUTE = "音なし";
export const DEVICE_MOVIE_BGM_PICK_HEADING = "森の音楽を選ぶ";
export const DEVICE_MOVIE_BGM_PICK_HINT =
  "▶ を押すと試聴できます。気に入った曲を選んでから、つぎへ進んでください。";
export const DEVICE_MOVIE_BGM_REQUIRED = "森の音楽をひとつ選んでください。";
export const DEVICE_MOVIE_BGM_LABEL = "森の音楽";
export const DEVICE_MOVIE_DRAFT_BGM_LOCKED = (name: string) =>
  `この下書きでは「${name}」が使われています。`;

export const DEVICE_MOVIE_STEP4_TITLE = "この思い出に名前をつけましょう";
export const DEVICE_MOVIE_STEP4_HINT =
  "空欄のままでもつくれます。そのときは「森のひとこま」になります。";

export const DEVICE_MOVIE_PICK_VIDEO = "動画を選ぶ";
export const DEVICE_MOVIE_PREVIEW_MAKE = "プレビューをつくる";
export const DEVICE_MOVIE_PREVIEW_BUSY = "森の映写便りを準備しています…";
export const DEVICE_MOVIE_PREVIEW_READY = "プレビューができました";
export const DEVICE_MOVIE_RETRY = "はじめから";
export const DEVICE_MOVIE_CONFIRM_NEXT = "この内容で残す";
export const DEVICE_MOVIE_SAVING = "森の映写便りを残しています…";
export const DEVICE_MOVIE_CONFIRMING = "完成を確認しています…";
export const DEVICE_MOVIE_SAVE_FAIL =
  "保存できませんでした。\nもう一度お試しください。不完全なデータは残していません。";
export const DEVICE_MOVIE_PHASE_C_NOTE =
  "プレビューまではどんぐりを使いません。完成のときに、はじめての一本か、どんぐり2こで確定します。";

export const DEVICE_MOVIE_FIRST_FREE_BODY = [
  "はじめての森の映写便りは、",
  "森からの贈りものです。",
  "この一場面を、小さな映像として残しますか？",
].join("\n");

export const DEVICE_MOVIE_PAID_BODY = [
  "この一場面を、森の映写便りに仕立てます。",
  "どんぐりを2こ使いますか？",
].join("\n");

export const DEVICE_MOVIE_BTN_CREATE_FREE = "この一場面を残す";
export const DEVICE_MOVIE_BTN_CREATE_PAID = "どんぐり2こで残す";
export const DEVICE_MOVIE_BTN_TWEAK = "もう少し整える";

export const DEVICE_MOVIE_DONE_TITLE = "森の映写便りができました";
export const DEVICE_MOVIE_DONE_BODY =
  "大切な一場面を、小さな映像として残しました。\nひとやすみの椅子で、あとから何度でも眺められます。";
export const DEVICE_MOVIE_DONE_TO_BROWSE = "椅子の一覧を見る";

export const DEVICE_MOVIE_UNCERTAIN_TITLE = "完成を確認しています";
export const DEVICE_MOVIE_UNCERTAIN_BODY = [
  "通信が戻ったら、もう一度お試しください。",
  "作品は仮保存のまま残しています。",
].join("\n");
export const DEVICE_MOVIE_BTN_RETRY_CONFIRM = "完成をもう一度確認する";
export const DEVICE_MOVIE_BTN_CONFIRM_LATER = "あとで確認する";

export const DEVICE_MOVIE_PENDING_BANNER =
  "完成待ちの森の映写便りがあります。通信を確認して、続きをどうぞ。";
export const DEVICE_MOVIE_PENDING_RETRY = "完成を確認する";

export const DEVICE_MOVIE_SHORTAGE_TITLE = "どんぐりが少し足りません";
export const DEVICE_MOVIE_SHORTAGE_BODY = [
  "下書きに残しました。",
  "どんぐりが2こ集まったら、続きを完成できます。",
].join("\n");

export const DEVICE_MOVIE_BTN_VIEW_DONGURI = "どんぐり帳を見る";
export const DEVICE_MOVIE_BTN_BACK_ENTRANCE = "椅子入口へ戻る";
export const DEVICE_MOVIE_BTN_TWEAK_SHORTAGE = "もう少し整える";

export const DEVICE_MOVIE_DRAFT_BADGE = "下書き";
export const DEVICE_MOVIE_DRAFT_RESUME = "下書きから続きをつくる";
export const DEVICE_MOVIE_DRAFT_NEW = "新しい動画からつくる";
export const DEVICE_MOVIE_DRAFT_DELETE = "この下書きを消す";
export const DEVICE_MOVIE_DRAFT_DELETE_DONE = "下書きを消しました";
export const DEVICE_MOVIE_DRAFT_SAVING = "下書きに残しています…";
export const DEVICE_MOVIE_BTN_SAVE_DRAFT = "下書きに残す";
export const DEVICE_MOVIE_DRAFT_SAVE_FAIL =
  "下書きを残できませんでした。\n通信や空き容量を確認して、もう一度お試しください。";
/** @deprecated カード表示へ移行。不足時モーダル本文で使う場合あり */
export const DEVICE_MOVIE_DRAFT_SAVED_HINT = "下書きに残しました。";
export const DEVICE_MOVIE_DRAFT_SAVED_TITLE = "下書きに残しました";
export const DEVICE_MOVIE_DRAFT_SAVED_CONTINUE = "このままつづける";
export const DEVICE_MOVIE_DRAFT_ONE_NOTE = "下書きはひとつまでです。";

export const DEVICE_MOVIE_DRAFT_REPLACE_TITLE = "すでに映写便りの下書きがあります";
export const DEVICE_MOVIE_DRAFT_REPLACE_BODY = [
  "下書きはひとつまでです。",
  "いまの下書きと入れ替えてよいですか？",
].join("\n");
export const DEVICE_MOVIE_DRAFT_REPLACE_CONFIRM = "入れ替える";
export const DEVICE_MOVIE_DRAFT_REPLACE_CANCEL = "やめる";

export const DEVICE_MOVIE_DONGURI_DRAFT_TITLE = "森の映写便りの下書きがあります";
export const DEVICE_MOVIE_DONGURI_DRAFT_CTA = "映写便りの続きへ戻る";

export const DEVICE_MOVIE_NEXT = "つぎへ";
export const DEVICE_MOVIE_BACK = "戻る";

export const DEVICE_MOVIE_TRIM_SHORT_HINT =
  "この動画は短いので、だいたい全部使えます。";
export const DEVICE_MOVIE_TRIM_START = "開始（秒）";
export const DEVICE_MOVIE_TRIM_DURATION = "長さ（秒）";

export function deviceMovieErrorUserMessage(
  code: MoriLogDeviceMovieErrorCode | string,
  fallback?: string,
): string {
  switch (code) {
    case "SOURCE_TOO_LARGE":
      return "この動画は少し大きすぎるようです。\n200MBまでの動画を選んでください。";
    case "SOURCE_TOO_LONG":
      return "この動画は60秒を超えています。\nもう少し短い動画を選んでください。";
    case "SOURCE_TOO_SHORT":
      return "3秒以上の動画を選んでください。";
    case "SOURCE_UNSUPPORTED":
      return "この形式の動画には、いまのところ対応していません。\n別の動画を試してみてください。";
    case "METADATA_LOAD_FAILED":
      return "動画の情報を読み取れませんでした。\n別の動画を選んでみてください。";
    case "INVALID_TRIM_RANGE":
      return "使う場面の指定が不正です。\n開始位置を少し動かしてやり直してください。";
    case "VIDEO_DECODE_FAILED":
      return "この動画の映像を解読できませんでした。\n別の動画を試してみてください。";
    case "AUDIO_DECODE_FAILED":
      return "この動画の音声形式には対応していません。\n「音なし」なら作成できる場合があります。";
    case "BGM_NOT_SELECTED":
      return "森の音楽をひとつ選んでください。";
    case "BGM_LOAD_FAILED":
    case "BGM_DECODE_FAILED":
    case "BGM_ENCODE_FAILED":
      return "森の音楽をうまく読み込めませんでした。\n別の曲を選ぶか、「動画の音を使う」「音なし」をお試しください。";
    case "BGM_TOO_SHORT":
      return "この森の音楽は動画より短いため使えません。\n別の曲を選んでください。";
    case "ENCODER_UNAVAILABLE":
      return "この端末では動画の書き出しに対応していません。";
    case "ENCODE_FAILED":
      return "動画の書き出しに失敗しました。\n時間をおいて、もう一度お試しください。";
    case "POSTER_CREATE_FAILED":
      return "ポスター画像を作れませんでした。\nもう一度お試しください。";
    case "CANCELLED":
      return "処理をキャンセルしました。";
    default:
      return fallback?.trim() || "うまく作成できませんでした。\nもう一度お試しください。";
  }
}

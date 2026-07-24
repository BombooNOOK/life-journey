/**
 * あしあと本文テンプレ — 配置データ（%・721×1024 基準）
 * ※このファイルはレイアウト定規の「ファイルに保存」から更新できます。
 */

import type { AshiatoPageTemplateId } from "@/lib/journal/ashiatoPageTemplates";

export type AshiatoLayoutPercentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AshiatoLayoutSlotId =
  | "photo"
  | "date"
  | "mood"
  | "activity"
  | "body"
  | "dailyNumber"
  | "reading";

export type AshiatoBodyWritingMode = "horizontal" | "vertical";

/** 日付の描画モード。未指定時は bodyWritingMode に追従（vertical→vertical、他→plain） */
export type AshiatoDateLayoutMode = "plain" | "vertical" | "slash_ymd_weekday";

/** テンプレに `/` がある日付枠：年・月・日を分け、下に曜日 */
export type AshiatoSlashYmdWeekdayDateParts = {
  year: AshiatoLayoutPercentRect;
  month: AshiatoLayoutPercentRect;
  day: AshiatoLayoutPercentRect;
  weekday: AshiatoLayoutPercentRect;
};

/** 横書き本文の余白・インデント（森の余白ノートなど） */
export type AshiatoHorizontalBodyTextLayout = {
  /** 1行の字数をこの分減らして左右に余白（テキスト塊の中央寄せ） */
  shrinkChars: number;
  align: "left" | "center";
  /**
   * 行番号（1始まり）→ その行の開始文字位置（1始まり）。
   * 例: 4行目を2文字目から → { 4: 2 }
   * 未指定行は 1（左端）
   */
  lineStartChar?: Partial<Record<number, number>>;
  /**
   * 文字サイズ別の開始位置上書き（指定行のみ。base の lineStartChar にマージ）。
   * 装飾位置は固定でも、字が大きいほど「何文字目から」が変わるため。
   */
  lineStartCharByMode?: Partial<
    Record<
      "relaxed" | "standard" | "generous" | "compact",
      Partial<Record<number, number>>
    >
  >;
  /**
   * 行番号 → 行末を何文字短くするか（装飾回避）。
   * 例: 7行目を3字早く終える → { 7: 3 }
   */
  lineShortenChars?: Partial<Record<number, number>>;
  /** 文字サイズ別の行末短縮上書き */
  lineShortenCharsByMode?: Partial<
    Record<
      "relaxed" | "standard" | "generous" | "compact",
      Partial<Record<number, number>>
    >
  >;
  /**
   * 文字サイズ別の最大行数上書き（計算値が枠ギリギリで最終文字が欠けるときの指定）。
   * 例: ぎゅっとを12行に固定 → { compact: 12 }
   */
  maxLinesByMode?: Partial<
    Record<"relaxed" | "standard" | "generous" | "compact", number>
  >;
};

/** 縦書き本文の列ごと調整（森の絵日記など。列は右から1始まり） */
export type AshiatoVerticalBodyTextLayout = {
  /** 列番号 → 開始文字位置（1始まり・上から）。例: 10列目を3文字目から → { 10: 3 } */
  columnStartChar?: Partial<Record<number, number>>;
  /** 文字サイズ別の開始位置上書き（指定列のみ。base にマージ） */
  columnStartCharByMode?: Partial<
    Record<
      "relaxed" | "standard" | "generous" | "compact",
      Partial<Record<number, number>>
    >
  >;
  /**
   * 列番号 → 他列より短くする文字数（末尾を早く切る）。
   * 下から N 文字目が末字 → shorten = N - 1
   */
  columnShortenChars?: Partial<Record<number, number>>;
  /** 文字サイズ別の列末短縮上書き */
  columnShortenCharsByMode?: Partial<
    Record<
      "relaxed" | "standard" | "generous" | "compact",
      Partial<Record<number, number>>
    >
  >;
};

export type AshiatoPageTemplateLayout = {
  bodyWritingMode: AshiatoBodyWritingMode;
  /** 写真の時計回り回転（度）。不要なら 0 */
  photoRotateDeg: number;
  /** 写真の角丸（設計px）。枠に合わせてクリップする */
  photoBorderRadiusPx?: number;
  dateLayout?: AshiatoDateLayoutMode;
  /** dateLayout=slash_ymd_weekday のとき（テンプレの / に合わせた枠） */
  dateParts?: AshiatoSlashYmdWeekdayDateParts;
  bodyTextLayout?: AshiatoHorizontalBodyTextLayout;
  verticalBodyTextLayout?: AshiatoVerticalBodyTextLayout;
  slots: Partial<Record<AshiatoLayoutSlotId, AshiatoLayoutPercentRect>>;
};

/**
 * - mori_* / suuji_standard: 定規で合わせた値
 * - suuji_ashiato_irodori: 旧 v2（724×1024）座標を % 換算して復元
 * - mood = 気分アイコン / activity = どんな1日だったか
 */
export const ASHIATO_PAGE_TEMPLATE_LAYOUTS: Record<
  AshiatoPageTemplateId,
  AshiatoPageTemplateLayout
> = {
  mori_enikki: {
    bodyWritingMode: "vertical",
    dateLayout: "vertical",
    photoRotateDeg: 0,
    /**
     * 罫線は最大10列。11列目は使わない。
     * 標準: 9列=下から2文字目で改行 / 10列=2文字目開始・下から7文字目が末字
     * たっぷり: 9列=下から3 / 10列=下から8
     * ぎゅっと: 9列=下から3 / 10列=下から9
     */
    verticalBodyTextLayout: {
      columnShortenChars: { 9: 1, 10: 6 },
      columnStartChar: { 10: 2 },
      columnShortenCharsByMode: {
        generous: { 9: 2, 10: 7 },
        compact: { 9: 2, 10: 8 },
      },
    },
    slots: {
      photo: { left: 8, top: 3, width: 84, height: 46.5 },
      // 気持ち上へ
      date: { left: 78, top: 54, width: 13.5, height: 26 },
      // ほんの少し右下へ戻す
      mood: { left: 79.3, top: 86.3, width: 10, height: 7.6 },
      // スタート位置はそのまま（0.5列分左）
      body: { left: 10.3, top: 53.5, width: 64.5, height: 43 },
    },
  },
  mori_yohaku_note: {
    bodyWritingMode: "horizontal",
    dateLayout: "slash_ymd_weekday",
    photoRotateDeg: 0,
    // テンプレの `/` は描画しない。年・月・日だけ差し込む
    dateParts: {
      year: { left: 74.2, top: 16.5, width: 5.0, height: 2.6 },
      month: { left: 81.2, top: 16.5, width: 2.7, height: 2.6 },
      day: { left: 84.8, top: 16.5, width: 4.0, height: 2.6 },
      weekday: { left: 76.0, top: 19.8, width: 14.0, height: 2.4 },
    },
    bodyTextLayout: {
      // 本文枠内で左右に余白を取り、テキスト塊を中央寄せ（文字自体は左寄せ）
      shrinkChars: 2,
      align: "left",
      // 装飾を避ける行ごとの開始位置（1始まり・標準系の基準）
      lineStartChar: {
        4: 3,
        5: 3,
        6: 5,
        7: 5,
        8: 7,
        9: 8,
        10: 9,
        11: 10,
      },
      lineStartCharByMode: {
        // ゆったり：字が大きいので開始位置を手前に／7行目は7文字目から
        relaxed: {
          3: 2,
          5: 4,
          7: 7,
        },
        // ぎゅっと最終行：11文字目から
        compact: {
          12: 11,
        },
      },
      /**
       * 行末短縮（後ろから N 文字目が末字 → shorten = N - 1）
       * 標準最終行(9)=後ろから3／たっぷり: 10行目=後ろから3・最終行(11)=後ろから5
       * ぎゅっと: 11行目=後ろから3、最終行(12)=後ろから5
       */
      lineShortenCharsByMode: {
        relaxed: {
          7: 3,
        },
        standard: {
          9: 2,
        },
        generous: {
          10: 2,
          11: 4,
        },
        compact: {
          11: 2,
          12: 4,
        },
      },
      // ぎゅっと：13行だと最終行が欠けるので12行に固定
      maxLinesByMode: {
        compact: 12,
      },
    },
    slots: {
      photo: { left: 12, top: 7.5, width: 49, height: 35.5 },
      date: { left: 73, top: 15, width: 21.5, height: 12 },
      mood: { left: 77.7, top: 24.8, width: 9, height: 7.2 },
      // 上部のマスキングテープ装飾を避けるため、およそ3文字目相当から開始
      body: { left: 8, top: 59.5, width: 85.5, height: 32 },
    },
  },
  suuji_ashiato_standard: {
    bodyWritingMode: "horizontal",
    photoRotateDeg: 0,
    slots: {
      photo: { left: 12.9, top: 17.5, width: 29.8, height: 22.7 },
      date: { left: 52.1, top: 15.3, width: 42.1, height: 3.6 },
      mood: { left: 56, top: 27, width: 8.5, height: 7.5 },
      activity: { left: 67.5, top: 27.6, width: 28, height: 6 },
      dailyNumber: { left: 53.5, top: 41.8, width: 40.2, height: 6.2 },
      body: { left: 8.3, top: 55.4, width: 83.4, height: 23.1 },
      reading: { left: 8.3, top: 82.4, width: 68, height: 12.1 },
    },
  },
  suuji_ashiato_irodori: {
    bodyWritingMode: "horizontal",
    photoRotateDeg: -5,
    bodyTextLayout: {
      shrinkChars: 0,
      align: "left",
      // 最終行が枠に被るため行数を抑える
      maxLinesByMode: {
        generous: 9,
        compact: 10,
      },
    },
    slots: {
      photo: { left: 18.37, top: 12.01, width: 36.33, height: 25.68 },
      // 約1.5行上・3文字左
      date: { left: 23.3, top: 3.6, width: 52.62, height: 3.13 },
      mood: { left: 59, top: 34.57, width: 7.46, height: 5.27 },
      activity: { left: 69.75, top: 35.74, width: 23.2, height: 3.22 },
      // 僅かに左・0.5文字上（3枠まとめて）
      dailyNumber: { left: 61.5, top: 17.4, width: 29.73, height: 8.98 },
      body: { left: 8.29, top: 48.93, width: 83.43, height: 27.15 },
      // 上げすぎた分を少し戻す（5行分は維持）
      reading: { left: 8.29, top: 82.2, width: 62.02, height: 13.3 },
    },
  },
};

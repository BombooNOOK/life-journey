/** LJD 下部ナビ・あしあとまわり半没入UIのアセット／面トーン */

export const LJD_NAV_ASSET_DIR = "/images/ljd/nav" as const;

const LJD_NAV_ASSET_VERSION = 1;

function navAsset(filename: string): string {
  return `${LJD_NAV_ASSET_DIR}/${filename}?v=${LJD_NAV_ASSET_VERSION}`;
}

export const LJD_NAV_ICONS = {
  calendar: navAsset("nav_calendar.png"),
  diaryList: navAsset("nav_diary_list.png"),
  bookshelf: navAsset("nav_bookshelf.png"),
  loghouse: navAsset("nav_loghouse.png"),
} as const;

/** くすみ葉っぱ色（現在地・選択強調）。ミント／青み緑は使わない */
export const LJD_SAGE = "#66724e" as const;
export const LJD_SAGE_DEEP = "#4a5440" as const;
export const LJD_ACORN = "#a67c3d" as const;
export const LJD_GOLD = "#c49a3c" as const;
export const LJD_GOLD_HOVER = "#b38a32" as const;

/** あしあとまわりページの生成り背景 */
export const LJD_PAGE_BG_CLASS = "bg-[#f6f0e6]" as const;

/** やわらかい紙カード（あしあとまわりで再利用） */
export const LJD_PAPER_CARD_CLASS =
  "rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] shadow-[0_6px_18px_rgba(90,70,45,0.06)]" as const;

/** やや小さめの紙カード（一覧行コンテナなど） */
export const LJD_PAPER_PANEL_CLASS =
  "rounded-xl border border-[#e4d5c0]/90 bg-[#fdf8f0] shadow-[0_4px_14px_rgba(90,70,45,0.05)]" as const;

export const LJD_PAPER_CHIP_ACTIVE_CLASS =
  "border-[#c5b089]/95 bg-[#f3ead9] font-semibold text-[#4a3a28]" as const;

export const LJD_PAPER_CHIP_IDLE_CLASS =
  "border-[#e0d2bc]/90 bg-[#fffaf2]/90 text-[#6a5846] hover:bg-[#f7efe3]" as const;

/** 選択中（気分・タグ・検索スコープなど）— 薄いセージ寄り */
export const LJD_PAPER_SELECTED_CLASS =
  "border-[#a8b08f]/95 bg-[#eef1e4] font-medium text-[#4a5440]" as const;

/** テキスト入力・セレクト（温かい白紙） */
export const LJD_PAPER_INPUT_CLASS =
  "rounded-xl border border-[#e0d2bc]/95 bg-[#fffaf4] text-[#3f3428] outline-none ring-[#c5b089]/50 placeholder:text-[#9a8b78] focus:ring-2" as const;

/** 主ボタン（落ち着いた金色〜どんぐり） */
export const LJD_PAPER_PRIMARY_BTN_CLASS =
  "rounded-xl border border-[#b8893d]/80 bg-[#b8893d] text-white shadow-[0_2px_8px_rgba(90,70,45,0.12)] transition hover:border-[#a67a32] hover:bg-[#a67a32]" as const;

/** サブボタン（生成り＋薄い枠） */
export const LJD_PAPER_SECONDARY_BTN_CLASS =
  "rounded-xl border border-[#e0d2bc]/95 bg-[#faf3e8] text-[#5c4a35] transition hover:border-[#d5c3a8] hover:bg-[#f3ead8]" as const;

/** セージ寄りリンク／強調テキスト */
export const LJD_PAPER_LINK_CLASS =
  "font-medium text-[#4a5440] underline decoration-[#a8b08f]/80 underline-offset-2 hover:text-[#3d4634]" as const;

/** ヘッダー帯（真っ白すぎない） */
export const LJD_PAPER_HEADER_BAR_CLASS =
  "border-b border-[#e8dcc8]/90 bg-[#f7f0e4]/92 backdrop-blur" as const;

/** LJD 下部ナビ・共通半没入UI用のアセット／面トーン */

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

/** やわらかい紙カード（日記まわりで再利用） */
export const LJD_PAPER_CARD_CLASS =
  "rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] shadow-[0_6px_18px_rgba(90,70,45,0.06)]" as const;

export const LJD_PAPER_CHIP_ACTIVE_CLASS =
  "border-[#c5b089]/95 bg-[#f3ead9] font-semibold text-[#4a3a28]" as const;

export const LJD_PAPER_CHIP_IDLE_CLASS =
  "border-[#e0d2bc]/90 bg-[#fffaf2]/90 text-[#6a5846] hover:bg-[#f7efe3]" as const;

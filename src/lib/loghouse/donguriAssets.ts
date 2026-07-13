/** どんぐりUI資産（カプセル・どんぐり帳） */
export const DONGURI_ASSET_DIR = "/images/ljd/donguri" as const;

const DONGURI_ASSET_VERSION = 2;

function donguriAsset(filename: string): string {
  return `${DONGURI_ASSET_DIR}/${filename}?v=${DONGURI_ASSET_VERSION}`;
}

/** 所持数カプセル用アイコン（透過PNG） */
export const DONGURI_ICON_SRC = donguriAsset("donguri_icon.png");

/** どんぐり帳カード地（透過PNG） */
export const DONGURI_CHO_CARD_SRC = donguriAsset("donguri_cho_card.png");

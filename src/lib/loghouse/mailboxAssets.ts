/** ポスト（ヤギさん郵便）イラスト */
export const MAILBOX_ASSET_DIR = "/images/ljd/mailbox" as const;

const MAILBOX_ASSET_VERSION = 1;

function mailboxAsset(filename: string): string {
  return `${MAILBOX_ASSET_DIR}/${filename}?v=${MAILBOX_ASSET_VERSION}`;
}

/** 全身・通常立ち絵（案内・空状態メイン） */
export const MAILBOX_GOAT_FULL_MAIN_SRC = mailboxAsset("goat_postman_full_main.png");

/** 全身・別ポーズ（空状態差し替え・装飾） */
export const MAILBOX_GOAT_FULL_SUB_SRC = mailboxAsset("goat_postman_full_sub.png");

/** 顔アイコン（一覧の差出人） */
export const MAILBOX_GOAT_FACE_ICON_SRC = mailboxAsset("goat_postman_face_icon.png");

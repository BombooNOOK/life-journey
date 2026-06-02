import {
  DIARY_PREVIEW_PAGE_HEIGHT,
  DIARY_PREVIEW_PAGE_WIDTH,
} from "@/lib/journal/diaryPreviewFixedLayout";

/**
 * 背景テンプレ画像レイヤーの表示定数。
 * 外周の金枠は {@link @/lib/journal/diaryPreviewGoldFrame} + DiaryPreviewGoldFrameOverlay で描画する。
 * オーバーレイ（日付・数字・本文・コメント）の座標には影響しない。
 */

export const DIARY_PREVIEW_FRAME_PAGE_WIDTH = DIARY_PREVIEW_PAGE_WIDTH;
export const DIARY_PREVIEW_FRAME_PAGE_HEIGHT = DIARY_PREVIEW_PAGE_HEIGHT;

/**
 * 背景テンプレのみの内側余白（px）。
 * 0 = 724×1024 フルブリード（現在のオーバーレイ調整と一致）。
 * 枠欠け対策で内側に収める場合はここだけ変更する。
 */
export const DIARY_PREVIEW_FRAME_BG_INSET_PX = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

/** スケール後の枠用シェル（overflow まわり）。scale 係数とは無関係 */
export const DIARY_PREVIEW_FRAME_SHELL_CLASS = "diary-preview-frame-shell";

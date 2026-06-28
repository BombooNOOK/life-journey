/** 保存済み正方形写真の SNS 枠内での見え方（日記本体には保存しない） */

export type JournalSocialPostPhotoAdjust = {
  /** 正方形上の注目点 X（0〜1） */
  focusX: number;
  /** 正方形上の注目点 Y（0〜1） */
  focusY: number;
  /** 1 = 枠いっぱい、大きいほど拡大 */
  scale: number;
};

export const DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST: JournalSocialPostPhotoAdjust = {
  focusX: 0.5,
  focusY: 0.5,
  scale: 1,
};

export const JOURNAL_SOCIAL_POST_PHOTO_SCALE_MIN = 1;
export const JOURNAL_SOCIAL_POST_PHOTO_SCALE_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeJournalSocialPostPhotoAdjust(
  raw: Partial<JournalSocialPostPhotoAdjust> | null | undefined,
): JournalSocialPostPhotoAdjust {
  const focusX = Number(raw?.focusX);
  const focusY = Number(raw?.focusY);
  const scale = Number(raw?.scale);
  return {
    focusX: Number.isFinite(focusX) ? clamp(focusX, 0, 1) : DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST.focusX,
    focusY: Number.isFinite(focusY) ? clamp(focusY, 0, 1) : DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST.focusY,
    scale: Number.isFinite(scale)
      ? clamp(scale, JOURNAL_SOCIAL_POST_PHOTO_SCALE_MIN, JOURNAL_SOCIAL_POST_PHOTO_SCALE_MAX)
      : DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST.scale,
  };
}

export function isDefaultJournalSocialPostPhotoAdjust(
  adjust: JournalSocialPostPhotoAdjust,
): boolean {
  const d = DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST;
  return (
    Math.abs(adjust.focusX - d.focusX) < 0.0001 &&
    Math.abs(adjust.focusY - d.focusY) < 0.0001 &&
    Math.abs(adjust.scale - d.scale) < 0.0001
  );
}

export function journalSocialPostPhotoAdjustEquals(
  a: JournalSocialPostPhotoAdjust,
  b: JournalSocialPostPhotoAdjust,
): boolean {
  const left = normalizeJournalSocialPostPhotoAdjust(a);
  const right = normalizeJournalSocialPostPhotoAdjust(b);
  return (
    Math.abs(left.focusX - right.focusX) < 0.0001 &&
    Math.abs(left.focusY - right.focusY) < 0.0001 &&
    Math.abs(left.scale - right.scale) < 0.0001
  );
}

export function parseJournalSocialPostPhotoAdjustFromSearchParams(
  params: Pick<URLSearchParams, "get">,
): JournalSocialPostPhotoAdjust {
  return normalizeJournalSocialPostPhotoAdjust({
    focusX: params.get("focusX") != null ? Number(params.get("focusX")) : undefined,
    focusY: params.get("focusY") != null ? Number(params.get("focusY")) : undefined,
    scale: params.get("scale") != null ? Number(params.get("scale")) : undefined,
  });
}

export function appendJournalSocialPostPhotoAdjustToSearchParams(
  params: URLSearchParams,
  adjust: JournalSocialPostPhotoAdjust,
): void {
  if (isDefaultJournalSocialPostPhotoAdjust(adjust)) return;
  params.set("focusX", String(adjust.focusX));
  params.set("focusY", String(adjust.focusY));
  params.set("scale", String(adjust.scale));
}

/** 正方形ソースから SNS 写真枠用の切り出し矩形（sharp extract 用・整数 px） */
export function computeSquarePhotoCropRect(input: {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  adjust: JournalSocialPostPhotoAdjust;
}): { left: number; top: number; width: number; height: number } {
  const sourceWidth = Math.max(1, Math.round(input.sourceWidth));
  const sourceHeight = Math.max(1, Math.round(input.sourceHeight));
  const side = Math.min(sourceWidth, sourceHeight);
  const squareLeft = Math.floor((sourceWidth - side) / 2);
  const squareTop = Math.floor((sourceHeight - side) / 2);
  const adjust = normalizeJournalSocialPostPhotoAdjust(input.adjust);
  const targetAspect = input.targetWidth / input.targetHeight;

  let baseCropWidth: number;
  let baseCropHeight: number;
  if (targetAspect >= 1) {
    baseCropWidth = side;
    baseCropHeight = side / targetAspect;
  } else {
    baseCropHeight = side;
    baseCropWidth = side * targetAspect;
  }

  const cropWidth = Math.max(1, Math.min(side, baseCropWidth / adjust.scale));
  const cropHeight = Math.max(1, Math.min(side, baseCropHeight / adjust.scale));

  const centerX = adjust.focusX * side;
  const centerY = adjust.focusY * side;
  const maxLeft = Math.max(0, side - cropWidth);
  const maxTop = Math.max(0, side - cropHeight);
  const leftInSquare = clamp(centerX - cropWidth / 2, 0, maxLeft);
  const topInSquare = clamp(centerY - cropHeight / 2, 0, maxTop);

  return {
    left: squareLeft + Math.round(leftInSquare),
    top: squareTop + Math.round(topInSquare),
    width: Math.max(1, Math.min(sourceWidth - squareLeft - Math.round(leftInSquare), Math.round(cropWidth))),
    height: Math.max(1, Math.min(sourceHeight - squareTop - Math.round(topInSquare), Math.round(cropHeight))),
  };
}

/** 調整 UI 用：正方形上の切り出し枠（0〜1 正規化） */
export function computeNormalizedPhotoCropFrame(input: {
  targetWidth: number;
  targetHeight: number;
  adjust: JournalSocialPostPhotoAdjust;
}): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const adjust = normalizeJournalSocialPostPhotoAdjust(input.adjust);
  const targetAspect = input.targetWidth / input.targetHeight;

  let baseWidth: number;
  let baseHeight: number;
  if (targetAspect >= 1) {
    baseWidth = 1;
    baseHeight = 1 / targetAspect;
  } else {
    baseHeight = 1;
    baseWidth = targetAspect;
  }

  const width = baseWidth / adjust.scale;
  const height = baseHeight / adjust.scale;
  const maxLeft = Math.max(0, 1 - width);
  const maxTop = Math.max(0, 1 - height);
  const left = clamp(adjust.focusX - width / 2, 0, maxLeft);
  const top = clamp(adjust.focusY - height / 2, 0, maxTop);

  return { left, top, width, height };
}

export function clampJournalSocialPostPhotoAdjustFocus(input: {
  focusX: number;
  focusY: number;
  targetWidth: number;
  targetHeight: number;
  scale: number;
}): Pick<JournalSocialPostPhotoAdjust, "focusX" | "focusY"> {
  const frame = computeNormalizedPhotoCropFrame({
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    adjust: {
      focusX: input.focusX,
      focusY: input.focusY,
      scale: input.scale,
    },
  });
  return {
    focusX: clamp(input.focusX, frame.width / 2, 1 - frame.width / 2),
    focusY: clamp(input.focusY, frame.height / 2, 1 - frame.height / 2),
  };
}

/** 正方形上の frame を元画像の正規化座標（0〜1）へ */
export function computeSourceNormalizedCropFrame(input: {
  sourceWidth: number;
  sourceHeight: number;
  squareFrame: { left: number; top: number; width: number; height: number };
}): { left: number; top: number; width: number; height: number } {
  const sourceWidth = Math.max(1, input.sourceWidth);
  const sourceHeight = Math.max(1, input.sourceHeight);
  const side = Math.min(sourceWidth, sourceHeight);
  const squareLeftNorm = (sourceWidth - side) / (2 * sourceWidth);
  const squareTopNorm = (sourceHeight - side) / (2 * sourceHeight);
  const squareWidthNorm = side / sourceWidth;
  const squareHeightNorm = side / sourceHeight;
  const { squareFrame } = input;

  return {
    left: squareLeftNorm + squareFrame.left * squareWidthNorm,
    top: squareTopNorm + squareFrame.top * squareHeightNorm,
    width: squareFrame.width * squareWidthNorm,
    height: squareFrame.height * squareHeightNorm,
  };
}

/** 調整 UI：投稿画像スロットと同じ切り出し見え方（px 配置・縦横比維持） */
export function buildPhotoCropSlotPreviewLayout(input: {
  sourceWidth: number;
  sourceHeight: number;
  squareFrame: { left: number; top: number; width: number; height: number };
  containerWidth: number;
}): {
  /** 背景画像の表示幅（px）。高さは auto で元画像の縦横比を維持 */
  displayWidth: number;
  left: number;
  top: number;
} {
  const crop = computeSourceNormalizedCropFrame({
    sourceWidth: input.sourceWidth,
    sourceHeight: input.sourceHeight,
    squareFrame: input.squareFrame,
  });
  const imageAspect = Math.max(1, input.sourceWidth) / Math.max(1, input.sourceHeight);
  const displayWidth = input.containerWidth / crop.width;
  const displayHeight = displayWidth / imageAspect;

  return {
    displayWidth,
    left: -crop.left * displayWidth,
    top: -crop.top * displayHeight,
  };
}

/** ドラッグ量（コンテナ px）→ focus 変化量 */
export function photoAdjustFocusDeltaFromDrag(input: {
  deltaX: number;
  deltaY: number;
  containerWidth: number;
  containerHeight: number;
  frameWidth: number;
  frameHeight: number;
}): { deltaFocusX: number; deltaFocusY: number } {
  if (input.containerWidth <= 0 || input.containerHeight <= 0) {
    return { deltaFocusX: 0, deltaFocusY: 0 };
  }
  return {
    deltaFocusX: (-input.deltaX / input.containerWidth) * input.frameWidth,
    deltaFocusY: (-input.deltaY / input.containerHeight) * input.frameHeight,
  };
}

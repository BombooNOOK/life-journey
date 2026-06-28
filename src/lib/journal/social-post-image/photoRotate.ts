import sharp from "sharp";

export type RotatedPhotoLayerOffset = {
  /** 回転後レイヤー内で、元画像左上 (0,0) が置かれる位置 */
  layerLeft: number;
  layerTop: number;
  width: number;
  height: number;
};

/** sharp.rotate（画像中心軸）後に、元左上がレイヤー内のどこに来るか */
export function computeSharpRotateTopLeftLayerOffset(
  width: number,
  height: number,
  angleDeg: number,
): RotatedPhotoLayerOffset {
  if (angleDeg === 0) {
    return { layerLeft: 0, layerTop: 0, width, height };
  }

  const theta = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const cx = width / 2;
  const cy = height / 2;

  const rotate = (x: number, y: number): readonly [number, number] => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos] as const;
  };

  const corners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ].map(([x, y]) => rotate(x, y));

  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const [tlX, tlY] = rotate(0, 0);

  return {
    layerLeft: Math.round(tlX - minX),
    layerTop: Math.round(tlY - minY),
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY - minY),
  };
}

/** @deprecated computeSharpRotateTopLeftLayerOffset を使用 */
export function computeRotatedPhotoLayerMinCorner(
  width: number,
  height: number,
  angleDeg: number,
): { minX: number; minY: number; width: number; height: number } {
  const offset = computeSharpRotateTopLeftLayerOffset(width, height, angleDeg);
  return {
    minX: -offset.layerLeft,
    minY: -offset.layerTop,
    width: offset.width,
    height: offset.height,
  };
}

/** @deprecated computeSharpRotateTopLeftLayerOffset を使用 */
export function computeRotatedLayerBoundsAroundTopLeft(
  width: number,
  height: number,
  angleDeg: number,
): { width: number; height: number } {
  const bounds = computeSharpRotateTopLeftLayerOffset(width, height, angleDeg);
  return { width: bounds.width, height: bounds.height };
}

/** 写真レイヤーを sharp.rotate で回転（中心軸・高品質補間） */
export async function rotatePhotoLayerAroundTopLeft(
  layer: Buffer,
  width: number,
  height: number,
  angleDeg: number,
): Promise<Buffer> {
  void width;
  void height;
  if (angleDeg === 0) return layer;

  return sharp(layer)
    .rotate(angleDeg, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** 回転後も元写真の左上がスロット左上 (slot.x, slot.y) に来る合成位置 */
export function journalSocialPostPhotoCompositePosition(
  slot: { x: number; y: number; width: number; height: number },
  angleDeg: number,
): { left: number; top: number } {
  if (angleDeg === 0) {
    return { left: slot.x, top: slot.y };
  }
  const { layerLeft, layerTop } = computeSharpRotateTopLeftLayerOffset(
    slot.width,
    slot.height,
    angleDeg,
  );
  return {
    left: Math.round(slot.x - layerLeft),
    top: Math.round(slot.y - layerTop),
  };
}

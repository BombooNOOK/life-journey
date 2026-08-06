/**
 * device_movie_basic の 1 フレーム合成（背景→動画cover→前面→文字）。
 */

import {
  DEVICE_MOVIE_BASIC_FONT_STACK,
  DEVICE_MOVIE_BASIC_TEXT_COLOR,
  deviceMovieBasicBackgroundPath,
  deviceMovieBasicForegroundPath,
  formatDeviceMovieDisplayDate,
  resolveDeviceMovieCoverDraw,
  scaleDeviceMovieBasicLayout,
  type DeviceMovieDecorationVariant,
  type DeviceMovieTemplateLayout,
} from "@/lib/journal/moriLog/deviceMovieBasicTemplate";

const DEFAULT_TITLE = "森のひとこま";

function defaultTitle(): string {
  return DEFAULT_TITLE;
}

export type DeviceMovieBasicAssets = {
  background: CanvasImageSource;
  foreground: CanvasImageSource;
  variant: DeviceMovieDecorationVariant;
};

const assetCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = assetCache.get(src);
  if (cached?.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      assetCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

export async function loadDeviceMovieBasicAssets(
  variant: DeviceMovieDecorationVariant,
): Promise<DeviceMovieBasicAssets> {
  const [background, foreground] = await Promise.all([
    loadImage(deviceMovieBasicBackgroundPath(variant)),
    loadImage(deviceMovieBasicForegroundPath()),
  ]);
  return { background, foreground, variant };
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number; borderRadius: number },
): void {
  const r = Math.min(rect.borderRadius, rect.width / 2, rect.height / 2);
  const { x, y, width: w, height: h } = rect;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
}

function ellipsizeToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (maxWidth <= 0) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? ellipsis : `${text.slice(0, lo)}${ellipsis}`;
}

export type PaintDeviceMovieBasicFrameInput = {
  ctx: CanvasRenderingContext2D;
  layout: DeviceMovieTemplateLayout;
  assets: DeviceMovieBasicAssets;
  /**
   * 動画ソースを描画するコールバック。
   * フレーム座標系（0,0=動画枠左上）で cover 済み座標が渡る。
   */
  drawVideo: (args: {
    ctx: CanvasRenderingContext2D;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
  }) => void;
  sourceWidth: number;
  sourceHeight: number;
  title: string;
  dateKey: string;
  focusX?: number;
  focusY?: number;
  scale?: number;
};

export function paintDeviceMovieBasicFrame(
  input: PaintDeviceMovieBasicFrameInput,
): void {
  const { ctx, layout, assets } = input;
  const { canvasWidth: w, canvasHeight: h, videoRect } = layout;

  ctx.save();
  ctx.fillStyle = "#f2e8cf";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(assets.background, 0, 0, w, h);

  const cover = resolveDeviceMovieCoverDraw({
    frameWidth: videoRect.width,
    frameHeight: videoRect.height,
    sourceWidth: input.sourceWidth,
    sourceHeight: input.sourceHeight,
    focusX: input.focusX,
    focusY: input.focusY,
    scale: input.scale,
  });

  ctx.save();
  clipRoundedRect(ctx, videoRect);
  ctx.translate(videoRect.x, videoRect.y);
  input.drawVideo({
    ctx,
    dx: cover.dx,
    dy: cover.dy,
    dw: cover.dw,
    dh: cover.dh,
  });
  ctx.restore();

  ctx.drawImage(assets.foreground, 0, 0, w, h);

  const titleRaw = input.title.trim() || defaultTitle();
  const dateLabel = formatDeviceMovieDisplayDate(input.dateKey);
  const textMax = Math.max(8, layout.text.right - layout.text.left);

  ctx.fillStyle = DEVICE_MOVIE_BASIC_TEXT_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.font = `600 ${layout.text.titleFontSize}px ${DEVICE_MOVIE_BASIC_FONT_STACK}`;
  const title = ellipsizeToWidth(ctx, titleRaw, textMax);
  ctx.fillText(title, layout.text.left, layout.text.titleCenterY);

  ctx.font = `500 ${layout.text.dateFontSize}px ${DEVICE_MOVIE_BASIC_FONT_STACK}`;
  ctx.fillText(dateLabel, layout.text.left, layout.text.dateCenterY);

  ctx.restore();
}

export function createDeviceMovieBasicLayoutForCanvas(options: {
  width: number;
  height: number;
}): DeviceMovieTemplateLayout {
  return scaleDeviceMovieBasicLayout(options.width, options.height);
}

/** 静止画ソース（ポスター・テスト）向けの簡易描画 */
export function paintDeviceMovieBasicStill(options: {
  ctx: CanvasRenderingContext2D;
  layout: DeviceMovieTemplateLayout;
  assets: DeviceMovieBasicAssets;
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  title: string;
  dateKey: string;
  focusX?: number;
  focusY?: number;
  scale?: number;
}): void {
  paintDeviceMovieBasicFrame({
    ctx: options.ctx,
    layout: options.layout,
    assets: options.assets,
    sourceWidth: options.sourceWidth,
    sourceHeight: options.sourceHeight,
    title: options.title,
    dateKey: options.dateKey,
    focusX: options.focusX,
    focusY: options.focusY,
    scale: options.scale,
    drawVideo: ({ ctx, dx, dy, dw, dh }) => {
      ctx.drawImage(options.source, dx, dy, dw, dh);
    },
  });
}

/**
 * device_movie_basic（森の映写便り）レイアウト・cover・装飾バリアント。
 * 素材設計サイズ 819×1024（≒4:5）の正規化座標を、出力キャンバスへスケールする。
 *
 * 前面オーバーレイ差し替え時は次だけを見直す:
 * - {@link deviceMovieBasicForegroundPath}
 * - {@link DEVICE_MOVIE_BASIC_LAYOUT_NORM}.videoRect（窓座標）
 * - {@link DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX}（真の透過PNGなら 0）
 */

export const DEVICE_MOVIE_BASIC_TEMPLATE_ID = "device_movie_basic" as const;
export const DEVICE_MOVIE_BASIC_TEMPLATE_VERSION = 1 as const;
export const DEVICE_MOVIE_BASIC_TEMPLATE_LABEL = "森の映写便り" as const;

export type DeviceMovieDecorationVariant = "lantern" | "owl" | "quill";

export const DEVICE_MOVIE_DECORATION_VARIANTS = [
  "lantern",
  "owl",
  "quill",
] as const satisfies readonly DeviceMovieDecorationVariant[];

/** 既存下書き・未設定時の固定後方互換値（開くたびに乱変しない） */
export const DEVICE_MOVIE_DECORATION_FALLBACK: DeviceMovieDecorationVariant =
  "lantern";

/** 通常ブラウザ向け基本キャンバス */
export const DEVICE_MOVIE_BASIC_CANVAS_DESKTOP = {
  width: 1080,
  height: 1350,
} as const;

/** iPhone Safari 向け安全策（4:5 かつ 16 の倍数。720×900 は高さが 16 非整除のため 704×880） */
export const DEVICE_MOVIE_BASIC_CANVAS_APPLE = {
  width: 704,
  height: 880,
} as const;

/**
 * 窓縁の応急 inset（制作 819px 基準）。
 * 真の透過PNG運用時は 0。黒マット焼き直し材のギザが戻ったら一時的に >0 も可。
 */
export const DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX = 0 as const;

/**
 * 応急内枠（生成り）色。紙／キャンバス下地に近い色。
 * pad=0 のときは描画しない。
 */
export const DEVICE_MOVIE_BASIC_VIDEO_MATTE_COLOR = "#f2e8cf" as const;

/**
 * 制作素材（819×1024）基準の正規化レイアウト。
 * 動画枠は foreground の透過窓に合わせる（差し替え時はここを更新）。
 * タイトル欄は背景3種の共通枠。文字開始は小物最長（右端≈0.203）より右。
 */
export const DEVICE_MOVIE_BASIC_LAYOUT_NORM = {
  designWidth: 819,
  designHeight: 1024,
  videoRect: {
    x: 61 / 819,
    y: 67 / 1024,
    width: 697 / 819,
    height: 718 / 1024,
    borderRadius: 60 / 819,
  },
  titleRect: {
    x: 128 / 819,
    y: 823 / 1024,
    width: 638 / 819,
    height: 185 / 1024,
  },
  /** タイトル・日付の描画領域（小物・右余白を確保） */
  text: {
    left: 0.24,
    right: 0.94,
    titleCenterY: 0.86,
    /** ラベル下端ギリギリを避ける（旧 0.925） */
    dateCenterY: 0.908,
  },
} as const;

export type DeviceMovieRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DeviceMovieRoundedRect = DeviceMovieRect & { borderRadius: number };

export type DeviceMovieTemplateLayout = {
  canvasWidth: number;
  canvasHeight: number;
  /** 前面オーバーレイの動画窓に対応する基準枠 */
  videoRect: DeviceMovieRoundedRect;
  /**
   * 実際に動画／ポスターをクリップする枠（videoRect より内側）。
   * edgePad=0 なら videoRect と同一。
   */
  videoClipRect: DeviceMovieRoundedRect;
  /**
   * 応急内枠。widthPx=0 なら塗りなし（恒久透過PNG向け）。
   * 前面オーバーレイより下・動画より上に描く（土台塗り→動画の順でリングになる）。
   */
  videoMatte: {
    widthPx: number;
    color: string;
  };
  titleRect: DeviceMovieRect;
  text: {
    left: number;
    right: number;
    titleCenterY: number;
    dateCenterY: number;
    titleFontSize: number;
    dateFontSize: number;
  };
};

export type DeviceMovieCoverDraw = {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  scale: number;
};

export const DEVICE_MOVIE_BASIC_ASSET_DIR =
  "/images/ljd/mori-log/device-movie-basic" as const;

export function deviceMovieBasicBackgroundPath(
  variant: DeviceMovieDecorationVariant,
): string {
  return `${DEVICE_MOVIE_BASIC_ASSET_DIR}/background-${variant}.png`;
}

/** 前面フレーム。真の透過PNG差し替え時はパス／ファイル名だけ差し替えればよい。 */
export function deviceMovieBasicForegroundPath(): string {
  return `${DEVICE_MOVIE_BASIC_ASSET_DIR}/foreground-overlay.png`;
}

export function isDeviceMovieDecorationVariant(
  value: unknown,
): value is DeviceMovieDecorationVariant {
  return value === "lantern" || value === "owl" || value === "quill";
}

export function resolveDeviceMovieDecorationVariant(
  value: unknown,
): DeviceMovieDecorationVariant {
  return isDeviceMovieDecorationVariant(value)
    ? value
    : DEVICE_MOVIE_DECORATION_FALLBACK;
}

/** 新規作成開始時に一度だけ呼ぶ。レンダリング内では呼ばない。 */
export function pickDeviceMovieDecorationVariant(
  random: () => number = Math.random,
): DeviceMovieDecorationVariant {
  const list = DEVICE_MOVIE_DECORATION_VARIANTS;
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)));
  return list[index]!;
}

export function resolveDeviceMovieBasicCanvasSize(options: {
  appleMobile: boolean;
}): { width: number; height: number } {
  return options.appleMobile
    ? { ...DEVICE_MOVIE_BASIC_CANVAS_APPLE }
    : { ...DEVICE_MOVIE_BASIC_CANVAS_DESKTOP };
}

/**
 * 動画窓からクリップ枠を求める。
 * padPx=0 なら同一（恒久透過PNG向け）。
 */
export function insetDeviceMovieRoundedRect(
  rect: DeviceMovieRoundedRect,
  padPx: number,
): DeviceMovieRoundedRect {
  const pad = Math.max(0, Math.round(padPx));
  if (pad <= 0) return { ...rect };
  const width = Math.max(1, rect.width - pad * 2);
  const height = Math.max(1, rect.height - pad * 2);
  const borderRadius = Math.max(0, rect.borderRadius - pad);
  return {
    x: rect.x + pad,
    y: rect.y + pad,
    width,
    height,
    borderRadius,
  };
}

export function scaleDeviceMovieBasicLayout(
  canvasWidth: number,
  canvasHeight: number,
  options?: { edgePadDesignPx?: number },
): DeviceMovieTemplateLayout {
  const n = DEVICE_MOVIE_BASIC_LAYOUT_NORM;
  const round = (v: number) => Math.max(1, Math.round(v));
  const edgePadDesign =
    options?.edgePadDesignPx ?? DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX;
  const edgePadPx = Math.max(
    0,
    Math.round((edgePadDesign * canvasWidth) / n.designWidth),
  );

  const videoRect: DeviceMovieRoundedRect = {
    x: Math.round(n.videoRect.x * canvasWidth),
    y: Math.round(n.videoRect.y * canvasHeight),
    width: round(n.videoRect.width * canvasWidth),
    height: round(n.videoRect.height * canvasHeight),
    borderRadius: round(n.videoRect.borderRadius * canvasWidth),
  };
  const videoClipRect = insetDeviceMovieRoundedRect(videoRect, edgePadPx);

  return {
    canvasWidth,
    canvasHeight,
    videoRect,
    videoClipRect,
    videoMatte: {
      widthPx: edgePadPx,
      color: DEVICE_MOVIE_BASIC_VIDEO_MATTE_COLOR,
    },
    titleRect: {
      x: Math.round(n.titleRect.x * canvasWidth),
      y: Math.round(n.titleRect.y * canvasHeight),
      width: round(n.titleRect.width * canvasWidth),
      height: round(n.titleRect.height * canvasHeight),
    },
    text: {
      left: Math.round(n.text.left * canvasWidth),
      right: Math.round(n.text.right * canvasWidth),
      titleCenterY: Math.round(n.text.titleCenterY * canvasHeight),
      dateCenterY: Math.round(n.text.dateCenterY * canvasHeight),
      titleFontSize: Math.max(22, Math.round(canvasHeight * 0.032)),
      dateFontSize: Math.max(16, Math.round(canvasHeight * 0.024)),
    },
  };
}

/**
 * 動画枠へ cover 配置する描画矩形（フレーム座標系）。
 * focusX/Y（0..1）はソース上の注視点。scale>=1 で将来のズームを許容。
 */
export function resolveDeviceMovieCoverDraw(options: {
  frameWidth: number;
  frameHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  focusX?: number;
  focusY?: number;
  scale?: number;
}): DeviceMovieCoverDraw {
  const frameW = Math.max(1, options.frameWidth);
  const frameH = Math.max(1, options.frameHeight);
  const sourceW = Math.max(1, options.sourceWidth);
  const sourceH = Math.max(1, options.sourceHeight);
  const focusX = clamp01(options.focusX ?? 0.5);
  const focusY = clamp01(options.focusY ?? 0.5);
  const zoom = Math.max(1, options.scale ?? 1);

  const baseScale = Math.max(frameW / sourceW, frameH / sourceH);
  const scale = baseScale * zoom;
  const dw = sourceW * scale;
  const dh = sourceH * scale;
  let dx = frameW / 2 - focusX * dw;
  let dy = frameH / 2 - focusY * dh;
  // 枠を必ず埋める（cover）。scale=1 では典型的に片側だけ余るのでクランプ。
  dx = Math.min(0, Math.max(frameW - dw, dx));
  dy = Math.min(0, Math.max(frameH - dh, dy));
  return { dx, dy, dw, dh, scale };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

/** YYYY-MM-DD → 2026.08.06 */
export function formatDeviceMovieDisplayDate(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!m) return dateKey.trim();
  return `${m[1]}.${m[2]}.${m[3]}`;
}

export function deviceMovieLocalDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export const DEVICE_MOVIE_BASIC_TEXT_COLOR = "#4a3728";
export const DEVICE_MOVIE_BASIC_FONT_STACK =
  '"Klee One", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

import type { CSSProperties } from "react";

/** 案内板 PNG の設計サイズ（ウィザードと本番で同じ座標系） */
export const HOME_FOREST_SIGN_DESIGN_SIZE = {
  mobile: { widthPx: 485, heightPx: 1024 },
  desktop: { widthPx: 1024, heightPx: 576 },
} as const;

export type HomeForestSignViewport = keyof typeof HOME_FOREST_SIGN_DESIGN_SIZE;

export type HomeForestSignTextPlacement = {
  /** 設計座標（px） */
  x: number;
  y: number;
  /** 看板の傾き（度） */
  rotate?: number;
  maxWidth?: number;
  fontSize: number;
  fontWeight?: 400 | 600 | 700;
  lineHeight?: number;
  textAnchor?: "topleft" | "center";
  color?: string;
  textAlign?: "left" | "center" | "right";
};

/** フクロウ先生など、看板上に重ねる画像（設計座標） */
export type HomeForestSignImagePlacement = {
  x: number;
  y: number;
  widthPx: number;
  /** 基準点（既定は左上） */
  anchor?: "topleft" | "bottomright";
};

export const HOME_FOREST_SIGN_OWL_TEACHER_INTRINSIC = {
  widthPx: 682,
  heightPx: 1024,
} as const;

export type HomeForestSignSignSlotId =
  | "sign-top-left"
  | "sign-mid-left"
  | "sign-top-right"
  | "sign-bottom-right";

export type HomeForestSignLayout = {
  title: HomeForestSignTextPlacement;
  subtitle: HomeForestSignTextPlacement;
  signTopLeft: HomeForestSignTextPlacement;
  signMidLeft: HomeForestSignTextPlacement;
  signTopRight: HomeForestSignTextPlacement;
  signBottomRight: HomeForestSignTextPlacement;
  loginNote?: HomeForestSignTextPlacement;
  owlTeacher: HomeForestSignImagePlacement;
};

/** 看板スロット → 導線 ID（位置は固定、ログイン状態で強調だけ変える） */
export const HOME_FOREST_SIGN_SLOT_NAV_IDS: Record<HomeForestSignSignSlotId, string> = {
  "sign-top-left": "first",
  "sign-mid-left": "loghouse",
  "sign-top-right": "forest-map",
  "sign-bottom-right": "ljd-help",
};

/** 森の案内板テキスト色（黒ではなく背景に馴染む茶系） */
export const HOME_FOREST_SIGN_TEXT_COLORS = {
  title: "#6b5344",
  sign: "#735a48",
  subtitle: "#5a6b52",
  soft: "#8a7563",
  link: "#6b5d4a",
} as const;

const WOOD_TEXT = HOME_FOREST_SIGN_TEXT_COLORS.sign;
const WOOD_TEXT_SOFT = HOME_FOREST_SIGN_TEXT_COLORS.soft;

export const HOME_FOREST_SIGN_TITLE_TEXT = "Life\nJourney\nDiary";
export const HOME_FOREST_SIGN_SUBTITLE_TEXT = "BambooNOOKの森で、\n今日のページをひらこう。";

/** 看板上の導線ラベル（スマホ配置向け・改行あり） */
export const HOME_FOREST_SIGN_NAV_LABELS = {
  first: "はじめての方",
  loghouse: "ログハウスへ",
  "forest-map": "BambooNOOKの森\n案内図",
  "ljd-help": "森の案内所",
} as const;

/** 看板リンク押下時のフクロウ表示文言 */
export const HOME_FOREST_SIGN_NAV_LOADING_LABELS: Record<
  keyof typeof HOME_FOREST_SIGN_NAV_LABELS | "loginNote",
  string
> = {
  first: "ガイドを開いています…",
  loghouse: "ログハウスを開いています…",
  "forest-map": "森の案内図を開いています…",
  "ljd-help": "森の案内所を開いています…",
  loginNote: "ログイン画面を開いています…",
};

/** 未ログイン時：既存アカウント向けログイン導線 */
export const HOME_FOREST_SIGN_LOG_HOUSE_NOTE = "ログインはこちら";
/** @deprecated preview 定規用。 {@link HOME_FOREST_SIGN_LOG_HOUSE_NOTE} と同じ文言 */
export const HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT = HOME_FOREST_SIGN_LOG_HOUSE_NOTE;

/** 仮配置。`/preview/home-forest-sign/layout` で微調整してここを更新 */
export const HOME_FOREST_SIGN_LAYOUT: Record<HomeForestSignViewport, HomeForestSignLayout> = {
  mobile: {
    title: {
      x: 242,
      y: 175,
      textAnchor: "center",
      fontSize: 45,
      fontWeight: 700,
      color: HOME_FOREST_SIGN_TEXT_COLORS.title,
      maxWidth: 440,
      lineHeight: 1.1,
      textAlign: "center",
    },
    subtitle: {
      x: 242,
      y: 300,
      textAnchor: "center",
      fontSize: 18,
      fontWeight: 600,
      color: HOME_FOREST_SIGN_TEXT_COLORS.subtitle,
      maxWidth: 420,
      lineHeight: 1.45,
      textAlign: "center",
    },
    signTopLeft: {
      x: 60,
      y: 450,
      rotate: 4,
      fontSize: 25,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 160,
      lineHeight: 1.3,
    },
    signMidLeft: {
      x: 177,
      y: 602,
      textAnchor: "center",
      textAlign: "center",
      fontSize: 26,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 200,
      lineHeight: 1.3,
    },
    signTopRight: {
      x: 290,
      y: 536,
      rotate: -5,
      fontSize: 18,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 175,
      lineHeight: 1.28,
      textAlign: "center",
    },
    signBottomRight: {
      x: 280,
      y: 716,
      rotate: 2,
      fontSize: 23,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 160,
      lineHeight: 1.3,
    },
    loginNote: {
      x: 177,
      y: 628,
      textAnchor: "center",
      textAlign: "center",
      fontSize: 12,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 320,
      lineHeight: 1.5,
    },
    owlTeacher: {
      x: 478,
      y: 1035,
      widthPx: 215,
      anchor: "bottomright",
    },
  },
  desktop: {
    title: {
      x: 108,
      y: 80,
      fontSize: 45,
      fontWeight: 700,
      color: HOME_FOREST_SIGN_TEXT_COLORS.title,
      maxWidth: 360,
      lineHeight: 1.1,
    },
    subtitle: {
      x: 75,
      y: 250,
      fontSize: 25,
      fontWeight: 600,
      color: HOME_FOREST_SIGN_TEXT_COLORS.subtitle,
      maxWidth: 380,
      lineHeight: 1.45,
    },
    signTopLeft: {
      x: 380,
      y: 135,
      rotate: 4,
      fontSize: 27,
      fontWeight: 600,
      color: WOOD_TEXT,
      lineHeight: 1.3,
    },
    signMidLeft: {
      x: 543,
      y: 288,
      textAnchor: "center",
      textAlign: "center",
      fontSize: 28,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 220,
      lineHeight: 1.3,
    },
    signTopRight: {
      x: 695,
      y: 206,
      rotate: -5,
      fontSize: 18,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 180,
      lineHeight: 1.28,
      textAlign: "center",
    },
    signBottomRight: {
      x: 665,
      y: 398,
      rotate: 2,
      fontSize: 23,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 160,
      lineHeight: 1.3,
    },
    loginNote: {
      x: 543,
      y: 310,
      textAnchor: "center",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 600,
      color: WOOD_TEXT,
      maxWidth: 280,
      lineHeight: 1.5,
    },
    owlTeacher: {
      x: 148,
      y: 322,
      widthPx: 200,
      anchor: "topleft",
    },
  },
};

export function homeForestSignLayoutFor(viewport: HomeForestSignViewport): HomeForestSignLayout {
  return HOME_FOREST_SIGN_LAYOUT[viewport];
}

export function homeForestSignDesignSize(viewport: HomeForestSignViewport) {
  return HOME_FOREST_SIGN_DESIGN_SIZE[viewport];
}

export function homeForestSignPlacementStyle(
  placement: HomeForestSignTextPlacement,
  viewport: HomeForestSignViewport,
  coverLayout?: ObjectCoverLayout | null,
): CSSProperties {
  const { widthPx, heightPx } = HOME_FOREST_SIGN_DESIGN_SIZE[viewport];
  const anchor = placement.textAnchor ?? "topleft";
  const transforms: string[] = [];

  if (anchor === "center") {
    transforms.push("translate(-50%, -50%)");
  }
  if (placement.rotate) {
    transforms.push(`rotate(${placement.rotate}deg)`);
  }

  if (coverLayout) {
    const x = coverLayout.offsetX + placement.x * coverLayout.scale;
    const y = coverLayout.offsetY + placement.y * coverLayout.scale;

    return {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      maxWidth: placement.maxWidth ? `${placement.maxWidth * coverLayout.scale}px` : undefined,
      fontSize: `${placement.fontSize * coverLayout.scale}px`,
      fontWeight: placement.fontWeight ?? 600,
      lineHeight: placement.lineHeight ?? 1.35,
      color: placement.color ?? WOOD_TEXT,
      textAlign: placement.textAlign ?? (anchor === "center" ? "center" : "left"),
      transform: transforms.length > 0 ? transforms.join(" ") : undefined,
      transformOrigin: anchor === "center" ? "center center" : "left top",
    };
  }

  return {
    position: "absolute",
    left: `${(placement.x / widthPx) * 100}%`,
    top: `${(placement.y / heightPx) * 100}%`,
    maxWidth: placement.maxWidth ? `${(placement.maxWidth / widthPx) * 100}%` : undefined,
    fontSize: `${(placement.fontSize / heightPx) * 100}%`,
    fontWeight: placement.fontWeight ?? 600,
    lineHeight: placement.lineHeight ?? 1.35,
    color: placement.color ?? WOOD_TEXT,
    textAlign: placement.textAlign ?? (anchor === "center" ? "center" : "left"),
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformOrigin: anchor === "center" ? "center center" : "left top",
  };
}

export function homeForestSignImagePlacementStyle(
  placement: HomeForestSignImagePlacement,
  viewport: HomeForestSignViewport,
  coverLayout?: ObjectCoverLayout | null,
): CSSProperties {
  const { widthPx: designW, heightPx: designH } = HOME_FOREST_SIGN_DESIGN_SIZE[viewport];
  const anchor = placement.anchor ?? "topleft";
  const aspect =
    HOME_FOREST_SIGN_OWL_TEACHER_INTRINSIC.heightPx /
    HOME_FOREST_SIGN_OWL_TEACHER_INTRINSIC.widthPx;
  const heightPx = placement.widthPx * aspect;

  if (coverLayout) {
    const w = placement.widthPx * coverLayout.scale;
    const h = heightPx * coverLayout.scale;
    const x = coverLayout.offsetX + placement.x * coverLayout.scale;
    const y = coverLayout.offsetY + placement.y * coverLayout.scale;

    return {
      position: "absolute",
      left: anchor === "bottomright" ? `${x - w}px` : `${x}px`,
      top: anchor === "bottomright" ? `${y - h}px` : `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
    };
  }

  const transforms: string[] = [];
  if (anchor === "bottomright") {
    transforms.push("translate(-100%, -100%)");
  }

  return {
    position: "absolute",
    left: `${(placement.x / designW) * 100}%`,
    top: `${(placement.y / designH) * 100}%`,
    width: `${(placement.widthPx / designW) * 100}%`,
    height: `${(heightPx / designH) * 100}%`,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
  };
}

export type HomeForestSignObjectPosition = {
  xPercent: number;
  yPercent: number;
};

/** 本番トップの object-cover 位置（旧ヒーローに合わせる） */
export const HOME_FOREST_SIGN_OBJECT_POSITION: Record<HomeForestSignViewport, HomeForestSignObjectPosition> = {
  mobile: { xPercent: 50, yPercent: 42 },
  desktop: { xPercent: 50, yPercent: 55 },
};

export type ObjectCoverLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
  containerWidth: number;
  containerHeight: number;
};

export function computeObjectCoverLayout(
  containerWidth: number,
  containerHeight: number,
  viewport: HomeForestSignViewport,
  objectPosition: HomeForestSignObjectPosition = HOME_FOREST_SIGN_OBJECT_POSITION[viewport],
): ObjectCoverLayout {
  const { widthPx, heightPx } = HOME_FOREST_SIGN_DESIGN_SIZE[viewport];
  const scale = Math.max(containerWidth / widthPx, containerHeight / heightPx);
  const displayedWidth = widthPx * scale;
  const displayedHeight = heightPx * scale;
  const offsetX = (containerWidth - displayedWidth) * (objectPosition.xPercent / 100);
  const offsetY = (containerHeight - displayedHeight) * (objectPosition.yPercent / 100);

  return {
    scale,
    offsetX,
    offsetY,
    containerWidth,
    containerHeight,
  };
}

export function objectPositionCss(objectPosition: HomeForestSignObjectPosition): string {
  return `${objectPosition.xPercent}% ${objectPosition.yPercent}%`;
}

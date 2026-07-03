import { buildLayoutGridSvg as buildDailyNumberLayoutGridSvg } from "@/lib/admin/post-atelier/daily-number/layoutDebug";

import {
  HOME_FOREST_SIGN_DESIGN_SIZE,
  HOME_FOREST_SIGN_LAYOUT,
  HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT,
  HOME_FOREST_SIGN_NAV_LABELS,
  HOME_FOREST_SIGN_SLOT_NAV_IDS,
  HOME_FOREST_SIGN_SUBTITLE_TEXT,
  HOME_FOREST_SIGN_TITLE_TEXT,
  type HomeForestSignLayout,
  type HomeForestSignSignSlotId,
  type HomeForestSignTextPlacement,
  type HomeForestSignViewport,
} from "./homeForestSignLayout";
import {
  HOME_FOREST_SIGN_DESKTOP_BG_SRC,
  HOME_FOREST_SIGN_MOBILE_BG_SRC,
} from "./homeForestSignAssets";

/** こころ予報・投稿画像定規と同じ：設計座標上の 1 辺 5px */
export const HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX = 5;

export type LayoutAnchor = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
};

export const HOME_FOREST_SIGN_LAYOUT_VIEWPORTS: {
  id: HomeForestSignViewport;
  label: string;
  templateSrc: string;
}[] = [
  {
    id: "mobile",
    label: "スマホ（485×1024）",
    templateSrc: HOME_FOREST_SIGN_MOBILE_BG_SRC,
  },
  {
    id: "desktop",
    label: "PC（1024×576）",
    templateSrc: HOME_FOREST_SIGN_DESKTOP_BG_SRC,
  },
];

const SAMPLE = {
  title: HOME_FOREST_SIGN_TITLE_TEXT,
  subtitle: HOME_FOREST_SIGN_SUBTITLE_TEXT,
  signTopLeft: HOME_FOREST_SIGN_NAV_LABELS.first,
  signMidLeft: HOME_FOREST_SIGN_NAV_LABELS.loghouse,
  signTopRight: HOME_FOREST_SIGN_NAV_LABELS.companion,
  signBottomRight: HOME_FOREST_SIGN_NAV_LABELS["ljd-help"],
  loginNote: HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT,
} as const;

function anchorFromPlacement(
  id: string,
  label: string,
  placement: HomeForestSignTextPlacement,
): LayoutAnchor {
  return {
    id,
    label,
    x: placement.x,
    y: placement.y,
    kind: placement.textAnchor === "center" ? "point" : "topleft",
  };
}

export function layoutAnchorsForViewport(viewport: HomeForestSignViewport): LayoutAnchor[] {
  const layout = HOME_FOREST_SIGN_LAYOUT[viewport];
  const anchors: LayoutAnchor[] = [
    anchorFromPlacement("title", "タイトル", layout.title),
    anchorFromPlacement("subtitle", "サブコピー", layout.subtitle),
    anchorFromPlacement("sign-top-left", `看板・左上（${HOME_FOREST_SIGN_SLOT_NAV_IDS["sign-top-left"]}）`, layout.signTopLeft),
    anchorFromPlacement("sign-mid-left", `看板・左中（${HOME_FOREST_SIGN_SLOT_NAV_IDS["sign-mid-left"]}）`, layout.signMidLeft),
    anchorFromPlacement("sign-top-right", `看板・右上（${HOME_FOREST_SIGN_SLOT_NAV_IDS["sign-top-right"]}）`, layout.signTopRight),
    anchorFromPlacement(
      "sign-bottom-right",
      `看板・右下（${HOME_FOREST_SIGN_SLOT_NAV_IDS["sign-bottom-right"]}）`,
      layout.signBottomRight,
    ),
  ];
  if (layout.loginNote) {
    anchors.push(anchorFromPlacement("login-note", "ログイン案内", layout.loginNote));
  }
  return anchors;
}

export function layoutSampleTextsForViewport(viewport: HomeForestSignViewport): Array<{
  id: string;
  text: string;
  placement: HomeForestSignTextPlacement;
}> {
  const layout = HOME_FOREST_SIGN_LAYOUT[viewport];
  return [
    { id: "title", text: SAMPLE.title, placement: layout.title },
    { id: "subtitle", text: SAMPLE.subtitle, placement: layout.subtitle },
    { id: "sign-top-left", text: SAMPLE.signTopLeft, placement: layout.signTopLeft },
    { id: "sign-mid-left", text: SAMPLE.signMidLeft, placement: layout.signMidLeft },
    { id: "sign-top-right", text: SAMPLE.signTopRight, placement: layout.signTopRight },
    { id: "sign-bottom-right", text: SAMPLE.signBottomRight, placement: layout.signBottomRight },
    ...(layout.loginNote
      ? [{ id: "login-note", text: SAMPLE.loginNote, placement: layout.loginNote }]
      : []),
  ];
}

export function signSlotPlacement(
  layout: HomeForestSignLayout,
  slotId: HomeForestSignSignSlotId,
): HomeForestSignTextPlacement {
  switch (slotId) {
    case "sign-top-left":
      return layout.signTopLeft;
    case "sign-mid-left":
      return layout.signMidLeft;
    case "sign-top-right":
      return layout.signTopRight;
    case "sign-bottom-right":
      return layout.signBottomRight;
  }
}

export function buildHomeForestSignLayoutGridSvg(viewport: HomeForestSignViewport): string {
  const { widthPx, heightPx } = HOME_FOREST_SIGN_DESIGN_SIZE[viewport];
  return buildDailyNumberLayoutGridSvg({ width: widthPx, height: heightPx });
}

export function buildHomeForestSignLayoutRulerSquareSvg(input: {
  viewport: HomeForestSignViewport;
  x: number;
  y: number;
  size?: number;
  label?: string;
}): string {
  const size = input.size ?? HOME_FOREST_SIGN_LAYOUT_RULER_SQUARE_PX;
  const label = input.label ?? `${size}px`;
  const { widthPx, heightPx } = HOME_FOREST_SIGN_DESIGN_SIZE[input.viewport];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
<rect x="${input.x}" y="${input.y}" width="${size}" height="${size}" fill="rgba(217,70,239,0.85)" stroke="#a21caf" stroke-width="1" />
<text x="${input.x + size + 4}" y="${input.y + size - 1}" font-family="monospace" font-size="10" fill="#86198f">${label} @ ${input.x},${input.y}</text>
</svg>`;
}

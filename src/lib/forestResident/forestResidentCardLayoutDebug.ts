import { FOREST_RESIDENT_CARD_LAYOUT, forestResidentFaceTuning } from "@/lib/forestResident/forestResidentAssets";

/** 住民票テンプレート PNG の設計サイズ */
export const FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX = 720 as const;

export type ForestResidentCardLayoutPin = {
  x: number;
  y: number;
};

export function forestResidentCardLayoutPercent(pin: ForestResidentCardLayoutPin): {
  left: string;
  top: string;
} {
  return {
    left: `${((pin.x / FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX) * 100).toFixed(1)}`,
    top: `${((pin.y / FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX) * 100).toFixed(1)}`,
  };
}

export function forestResidentBadgeImageBounds() {
  const { image } = FOREST_RESIDENT_CARD_LAYOUT.badge;
  const height = image.width * (28 / 22);
  return {
    left: 100 - image.right - image.width,
    top: 100 - image.bottom - height,
    width: image.width,
    height,
  };
}

export function buildForestResidentCardLayoutGridSvg(): string {
  const size = FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX;
  const step = 5;
  let lines = "";
  for (let i = 0; i <= size; i += step) {
    const major = i % 50 === 0;
    const stroke = major ? "rgba(16,120,80,0.35)" : "rgba(16,120,80,0.12)";
    const width = major ? 1 : 0.5;
    lines += `<line x1="${i}" y1="0" x2="${i}" y2="${size}" stroke="${stroke}" stroke-width="${width}" />`;
    lines += `<line x1="0" y1="${i}" x2="${size}" y2="${i}" stroke="${stroke}" stroke-width="${width}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${lines}</svg>`;
}

export function forestResidentCardLayoutRegions() {
  const layout = FOREST_RESIDENT_CARD_LAYOUT;
  const badgeImage = forestResidentBadgeImageBounds();

  return [
    {
      id: "face-frame",
      label: "顔（楕円枠）",
      color: "rgba(59,130,246,0.2)",
      border: "rgba(37,99,235,0.85)",
      left: layout.face.left,
      top: layout.face.top,
      width: layout.face.width,
      height: layout.face.height,
    },
    ...layout.lines.rows.map((top, index) => ({
      id: `line-${index + 1}`,
      label: ["おなまえ", "住民番号", "登録日"][index] ?? `line-${index + 1}`,
      color: "rgba(245,158,11,0.2)",
      border: "rgba(217,119,6,0.85)",
      left: layout.lines.left,
      top,
      width: layout.lines.width,
      height: layout.lines.height,
    })),
    {
      id: "badge-image",
      label: "バッジ画像",
      color: "rgba(168,85,247,0.2)",
      border: "rgba(147,51,234,0.9)",
      ...badgeImage,
    },
    {
      id: "badge-label",
      label: "グリーンバッジ（文字）",
      color: "rgba(16,185,129,0.2)",
      border: "rgba(5,150,105,0.9)",
      left: layout.badge.label.left,
      top: layout.badge.label.top,
      width: layout.badge.label.width,
      height: layout.badge.label.height,
    },
  ];
}

export function forestResidentCardLayoutDebugSnapshot() {
  return {
    layout: FOREST_RESIDENT_CARD_LAYOUT,
    faceTuning: forestResidentFaceTuning,
  };
}

export function forestResidentCardLayoutCopyHint(pin: ForestResidentCardLayoutPin): string {
  const pct = forestResidentCardLayoutPercent(pin);
  const regions = forestResidentCardLayoutRegions();
  const inside = regions.find(
    (region) =>
      pin.x >= (region.left / 100) * FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX &&
      pin.x <= ((region.left + region.width) / 100) * FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX &&
      pin.y >= (region.top / 100) * FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX &&
      pin.y <= ((region.top + region.height) / 100) * FOREST_RESIDENT_CARD_LAYOUT_SIZE_PX,
  );

  if (inside?.id === "badge-label") {
    return `badge.label: { left: ${pct.left}, top: ${pct.top}, ... }`;
  }
  if (inside?.id === "badge-image") {
    return `badge.image: { right: ..., bottom: ..., width: ${pct.left} 付近を left に換算 }`;
  }

  return `left: ${pct.left}, top: ${pct.top}`;
}

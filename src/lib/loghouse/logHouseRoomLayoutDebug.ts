import {
  LOG_HOUSE_ROOM_MOBILE_INTRINSIC,
  LOG_HOUSE_ROOM_SAMPLE_ALL_PARTS_SRC,
} from "@/lib/loghouse/logHouseRoomAssets";
import { LOG_HOUSE_ROOM_HOTSPOTS } from "@/lib/loghouse/logHouseRoomHotspots";
import {
  LOG_HOUSE_ROOM_PART_PLACEMENTS,
  LOG_HOUSE_ROOM_RABBIT_PLACEMENT,
} from "@/lib/loghouse/logHouseRoomLayout";

/** 室内背景の設計サイズ（px） */
export const LOG_HOUSE_ROOM_LAYOUT_SIZE_PX = LOG_HOUSE_ROOM_MOBILE_INTRINSIC;

/** こころ予報定規と同じ 5px マス */
export const LOG_HOUSE_ROOM_LAYOUT_RULER_SQUARE_PX = 5 as const;

export type LogHouseRoomLayoutPin = {
  x: number;
  y: number;
};

export type LogHouseRoomLayoutRegion = {
  id: string;
  label: string;
  kind: "part" | "hotspot" | "rabbit";
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  border: string;
  dashed?: boolean;
};

export function logHouseRoomLayoutPercent(pin: LogHouseRoomLayoutPin): {
  x: string;
  y: string;
} {
  return {
    x: ((pin.x / LOG_HOUSE_ROOM_LAYOUT_SIZE_PX.widthPx) * 100).toFixed(1),
    y: ((pin.y / LOG_HOUSE_ROOM_LAYOUT_SIZE_PX.heightPx) * 100).toFixed(1),
  };
}

export function logHouseRoomLayoutPxFromPercent(placement: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}): { x: number; y: number; width?: number; height?: number } {
  const { widthPx, heightPx } = LOG_HOUSE_ROOM_LAYOUT_SIZE_PX;
  return {
    x: Math.round((placement.x / 100) * widthPx),
    y: Math.round((placement.y / 100) * heightPx),
    width:
      placement.width == null ? undefined : Math.round((placement.width / 100) * widthPx),
    height:
      placement.height == null ? undefined : Math.round((placement.height / 100) * heightPx),
  };
}

export function buildLogHouseRoomLayoutGridSvg(): string {
  const { widthPx: width, heightPx: height } = LOG_HOUSE_ROOM_LAYOUT_SIZE_PX;
  const step = LOG_HOUSE_ROOM_LAYOUT_RULER_SQUARE_PX;
  let lines = "";
  for (let i = 0; i <= width; i += step) {
    const major = i % 50 === 0;
    const stroke = major ? "rgba(16,120,80,0.35)" : "rgba(16,120,80,0.12)";
    const strokeWidth = major ? 1 : 0.5;
    lines += `<line x1="${i}" y1="0" x2="${i}" y2="${height}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }
  for (let i = 0; i <= height; i += step) {
    const major = i % 50 === 0;
    const stroke = major ? "rgba(16,120,80,0.35)" : "rgba(16,120,80,0.12)";
    const strokeWidth = major ? 1 : 0.5;
    lines += `<line x1="0" y1="${i}" x2="${width}" y2="${i}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${lines}</svg>`;
}

const PART_REGION_STYLE: Record<
  string,
  { label: string; color: string; border: string }
> = {
  bookshelf: { label: "本棚", color: "rgba(59,130,246,0.18)", border: "rgba(37,99,235,0.9)" },
  chair: { label: "椅子", color: "rgba(20,184,166,0.18)", border: "rgba(13,148,136,0.9)" },
  desk: { label: "机", color: "rgba(245,158,11,0.18)", border: "rgba(217,119,6,0.9)" },
  residentCard: { label: "住民票", color: "rgba(168,85,247,0.18)", border: "rgba(147,51,234,0.9)" },
  todayResult: { label: "鑑定結果", color: "rgba(236,72,153,0.18)", border: "rgba(219,39,119,0.9)" },
  radio: { label: "ラジオ", color: "rgba(234,179,8,0.18)", border: "rgba(202,138,4,0.9)" },
};

const HOTSPOT_REGION_STYLE: Record<
  string,
  { label: string; color: string; border: string }
> = {
  bookshelf: { label: "本棚タップ", color: "rgba(59,130,246,0.08)", border: "rgba(37,99,235,0.55)" },
  desk: { label: "机タップ", color: "rgba(245,158,11,0.08)", border: "rgba(217,119,6,0.55)" },
  residentCard: { label: "住民票タップ", color: "rgba(168,85,247,0.08)", border: "rgba(147,51,234,0.55)" },
  todayResult: { label: "鑑定タップ", color: "rgba(236,72,153,0.08)", border: "rgba(219,39,119,0.55)" },
  radio: { label: "ラジオタップ", color: "rgba(234,179,8,0.08)", border: "rgba(202,138,4,0.55)" },
  chair: { label: "椅子タップ", color: "rgba(20,184,166,0.08)", border: "rgba(13,148,136,0.55)" },
};

export function logHouseRoomLayoutRegions(): LogHouseRoomLayoutRegion[] {
  const parts: LogHouseRoomLayoutRegion[] = LOG_HOUSE_ROOM_PART_PLACEMENTS.map((placement) => {
    const style = PART_REGION_STYLE[placement.id] ?? {
      label: placement.id,
      color: "rgba(100,116,139,0.15)",
      border: "rgba(71,85,105,0.8)",
    };
    return {
      id: `part-${placement.id}`,
      label: style.label,
      kind: "part",
      left: placement.x,
      top: placement.y,
      width: placement.width,
      height: placement.height,
      color: style.color,
      border: style.border,
    };
  });

  const hotspots: LogHouseRoomLayoutRegion[] = LOG_HOUSE_ROOM_HOTSPOTS.map((spot) => {
    const style = HOTSPOT_REGION_STYLE[spot.id] ?? {
      label: spot.id,
      color: "rgba(100,116,139,0.06)",
      border: "rgba(71,85,105,0.45)",
    };
    return {
      id: `hotspot-${spot.id}`,
      label: style.label,
      kind: "hotspot",
      left: spot.x,
      top: spot.y,
      width: spot.width,
      height: spot.height,
      color: style.color,
      border: style.border,
      dashed: true,
    };
  });

  const rabbit: LogHouseRoomLayoutRegion = {
    id: "part-rabbit",
    label: "うさぎ",
    kind: "rabbit",
    left: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.x,
    top: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.y,
    width: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.width,
    height: LOG_HOUSE_ROOM_RABBIT_PLACEMENT.height,
    color: "rgba(217,70,239,0.16)",
    border: "rgba(192,38,211,0.9)",
  };

  return [...parts, rabbit, ...hotspots];
}

export function logHouseRoomLayoutDebugSnapshot() {
  return {
    designSizePx: LOG_HOUSE_ROOM_LAYOUT_SIZE_PX,
    sampleReference: LOG_HOUSE_ROOM_SAMPLE_ALL_PARTS_SRC,
    partPlacements: LOG_HOUSE_ROOM_PART_PLACEMENTS,
    rabbitPlacement: LOG_HOUSE_ROOM_RABBIT_PLACEMENT,
    hotspots: LOG_HOUSE_ROOM_HOTSPOTS,
    editFiles: [
      "src/lib/loghouse/logHouseRoomLayout.ts",
      "src/lib/loghouse/logHouseRoomHotspots.ts",
    ],
  };
}

function regionContainsPin(region: LogHouseRoomLayoutRegion, pin: LogHouseRoomLayoutPin): boolean {
  const { widthPx, heightPx } = LOG_HOUSE_ROOM_LAYOUT_SIZE_PX;
  const leftPx = (region.left / 100) * widthPx;
  const topPx = (region.top / 100) * heightPx;
  const rightPx = leftPx + (region.width / 100) * widthPx;
  const bottomPx = topPx + (region.height / 100) * heightPx;
  return pin.x >= leftPx && pin.x <= rightPx && pin.y >= topPx && pin.y <= bottomPx;
}

export function logHouseRoomLayoutCopyHint(pin: LogHouseRoomLayoutPin): string {
  const pct = logHouseRoomLayoutPercent(pin);
  const inside = logHouseRoomLayoutRegions().find((region) => regionContainsPin(region, pin));

  if (inside?.kind === "part") {
    const partId = inside.id.replace(/^part-/, "");
    return `{ id: "${partId}", x: ${pct.x}, y: ${pct.y}, ... }  // logHouseRoomLayout.ts`;
  }
  if (inside?.kind === "rabbit") {
    return `LOG_HOUSE_ROOM_RABBIT_PLACEMENT: { x: ${pct.x}, y: ${pct.y}, ... }`;
  }
  if (inside?.kind === "hotspot") {
    const spotId = inside.id.replace(/^hotspot-/, "");
    return `{ id: "${spotId}", x: ${pct.x}, y: ${pct.y}, ... }  // logHouseRoomHotspots.ts`;
  }

  return `x: ${pct.x}, y: ${pct.y}`;
}

import {
  DAILY_NUMBER_COVER_SCHEDULED_DATE_LAYOUT,
  DAILY_NUMBER_TEMPLATE_SIZE,
  DAILY_NUMBER_TEXT_COLOR,
} from "./imageLayout";
import { buildSvgTextOverlay } from "./svgText";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 例: 2026年7月15日（水） */
export function formatDailyNumberCoverScheduledDate(scheduledDate: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return null;
  const [y, m, d] = scheduledDate.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  if (
    probe.getFullYear() !== y ||
    probe.getMonth() !== m - 1 ||
    probe.getDate() !== d
  ) {
    return null;
  }
  const weekday = WEEKDAY_JA[probe.getDay()]!;
  return `${y}年${m}月${d}日（${weekday}）`;
}

export function buildCoverScheduledDateOverlay(scheduledDate: string): Buffer | null {
  const label = formatDailyNumberCoverScheduledDate(scheduledDate);
  if (!label) return null;

  const layout = DAILY_NUMBER_COVER_SCHEDULED_DATE_LAYOUT;
  return buildSvgTextOverlay({
    width: DAILY_NUMBER_TEMPLATE_SIZE.widthPx,
    height: DAILY_NUMBER_TEMPLATE_SIZE.heightPx,
    color: DAILY_NUMBER_TEXT_COLOR,
    items: [
      {
        text: label,
        style: {
          x: layout.cx,
          y: layout.y,
          fontSize: layout.fontSize,
          fontWeight: layout.fontWeight,
          textAnchor: "middle",
          fill: "#6b5a48",
        },
      },
    ],
  });
}

/** サーバー／クライアントで一致させるため日付は常にこのタイムゾーンで整形する */
const TZ_JAPAN = "Asia/Tokyo";

export function formatDateTimeJa(value: string | number | Date): string {
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  return d.toLocaleString("ja-JP", {
    timeZone: TZ_JAPAN,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** 記録日は UTC 正午固定で保存されるため、一覧では日付のみ表示する */
export function isJournalEntryDateAnchor(d: Date): boolean {
  return (
    d.getUTCHours() === 12 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

export function formatJournalListCreatedLabel(createdAt: string | number | Date): string {
  const d =
    typeof createdAt === "string" || typeof createdAt === "number"
      ? new Date(createdAt)
      : createdAt;
  if (isJournalEntryDateAnchor(d)) {
    return d.toLocaleDateString("ja-JP", {
      timeZone: TZ_JAPAN,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  }
  return formatDateTimeJa(d);
}

const UPDATED_AT_MIN_DELTA_MS = 5000;

/** createdAt / updatedAt を同一タイムスタンプ基準で比較 */
export function shouldShowJournalUpdatedLabel(
  createdAt: string | number | Date,
  updatedAt: string | number | Date | null | undefined,
  thresholdMs = UPDATED_AT_MIN_DELTA_MS,
): boolean {
  if (updatedAt == null || updatedAt === "") return false;
  const c = new Date(createdAt).getTime();
  const u = new Date(updatedAt).getTime();
  if (!Number.isFinite(c) || !Number.isFinite(u)) return false;
  return u > c + thresholdMs;
}

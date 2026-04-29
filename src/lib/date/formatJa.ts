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

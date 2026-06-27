import type { DailyNumberGeneratedPayload } from "./types";

export function dailyNumberZipBasename(payload: DailyNumberGeneratedPayload): string {
  const dateCompact = payload.scheduledDate
    ? payload.scheduledDate.replaceAll("-", "")
    : "undated";
  return `${dateCompact}_kokoro-yoho_ud${payload.todayNumber}_${payload.character}`;
}

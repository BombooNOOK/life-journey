/**
 * 動的ルート `[profileId]` 用。`legacy:...` はパス上 `legacy%3A...` になるため、
 * Next/Vercel によっては params が未デコードのまま渡ることがある。
 */
export function parseProfileIdFromRouteParam(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

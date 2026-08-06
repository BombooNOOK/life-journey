/**
 * @deprecated 14日試用のバックフィル起点。試用廃止後は未使用。新規コードから参照しないこと。
 */
export const DEFAULT_OFFICIAL_LAUNCH_DATE = "2026-06-10";

/** @deprecated */
export function resolveOfficialLaunchDate(): Date {
  const raw =
    process.env.OFFICIAL_LAUNCH_DATE?.trim() ||
    process.env.NEXT_PUBLIC_OFFICIAL_LAUNCH_DATE?.trim() ||
    DEFAULT_OFFICIAL_LAUNCH_DATE;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return new Date(`${DEFAULT_OFFICIAL_LAUNCH_DATE}T00:00:00.000Z`);
  }
  return parsed;
}

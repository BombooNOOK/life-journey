import { SUBSCRIPTION_PLAN_PROFILE_LIMIT } from "@/lib/stripe/plans";

/** モニター利用時の実効プロフィール上限（スタンダードプラン相当） */
export const MONITOR_EFFECTIVE_PROFILE_LIMIT = SUBSCRIPTION_PLAN_PROFILE_LIMIT.standard;

export type ProfileLimitSettings = {
  isMonitor?: boolean | null;
  profileLimit?: number | null;
};

export function effectiveProfileLimit(settings: ProfileLimitSettings | null | undefined): number {
  if (settings?.isMonitor === true) {
    return MONITOR_EFFECTIVE_PROFILE_LIMIT;
  }
  const raw = settings?.profileLimit;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.trunc(raw);
  }
  return 1;
}

export function formatMyPageProfileLimitLabel(settings: ProfileLimitSettings | null | undefined): string {
  const effective = effectiveProfileLimit(settings);
  if (settings?.isMonitor === true) {
    return `${effective} プロフィール（モニター利用中）`;
  }
  return `${effective} プロフィール`;
}

export function formatAdminEffectiveProfileLimitLabel(
  settings: ProfileLimitSettings | null | undefined,
): string {
  if (settings?.isMonitor === true) {
    return `実効上限：${MONITOR_EFFECTIVE_PROFILE_LIMIT}（モニター利用中）`;
  }
  return String(settings?.profileLimit ?? 1);
}

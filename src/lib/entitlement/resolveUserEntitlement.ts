import { isStripeSubscriptionEntitled } from "@/lib/stripe/plans";

export type EntitlementAccountSettings = {
  isAdmin?: boolean | null;
  isMonitor?: boolean | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  /** @deprecated 14日試用は廃止。互換のため型のみ残す */
  freeTrialStartedAt?: Date | null;
};

export type ResolveUserEntitlementInput = {
  settings: EntitlementAccountSettings | null;
  journalEntryCount: number;
  now?: Date;
};

/** admin / monitor / subscriber 以外は free（どんぐり経済圏・試用期限なし） */
export type EntitlementTier = "admin" | "monitor" | "subscriber" | "free";

/** @deprecated 試用廃止後は常に none。UI 互換のため残す */
export type TrialBannerVariant = "none" | "not_started" | "warning" | "expired";

/** @deprecated 試用廃止後は付与しない。API 互換のため型のみ残す */
export type EntitlementDenialCode = "FREE_TRIAL_NOT_STARTED" | "FREE_TRIAL_EXPIRED";

export type UserEntitlement = {
  hasFullAccess: boolean;
  canUseContinuedFeatures: boolean;
  canCreateFirstJournal: boolean;
  tier: EntitlementTier;
  showTrialBanner: boolean;
  bannerVariant: TrialBannerVariant;
  trialDaysRemaining: number | null;
  trialDayIndex: number | null;
  denialCode: EntitlementDenialCode | null;
  denialMessage: string | null;
};

export type SerializedUserEntitlement = {
  tier: EntitlementTier;
  showTrialBanner: boolean;
  bannerVariant: TrialBannerVariant;
  canUseContinuedFeatures: boolean;
  canCreateFirstJournal: boolean;
  trialDaysRemaining: number | null;
  trialDayIndex: number | null;
};

export function isPaidSubscriber(settings: EntitlementAccountSettings | null | undefined): boolean {
  return (
    isStripeSubscriptionEntitled(settings?.subscriptionStatus) &&
    (settings?.subscriptionPlan === "light" || settings?.subscriptionPlan === "standard")
  );
}

function entitledResult(tier: EntitlementTier): UserEntitlement {
  return {
    hasFullAccess: true,
    canUseContinuedFeatures: true,
    canCreateFirstJournal: true,
    tier,
    showTrialBanner: false,
    bannerVariant: "none",
    trialDaysRemaining: null,
    trialDayIndex: null,
    denialCode: null,
    denialMessage: null,
  };
}

/**
 * どんぐり経済圏：課金プランなしでも機能は開放。
 * 「森にあしあとを残す」は別途どんぐり消費で制限する。
 */
export function resolveUserEntitlement(input: ResolveUserEntitlementInput): UserEntitlement {
  const settings = input.settings;

  if (settings?.isAdmin === true) return entitledResult("admin");
  if (settings?.isMonitor === true) return entitledResult("monitor");
  if (isPaidSubscriber(settings)) return entitledResult("subscriber");
  return entitledResult("free");
}

export function canCreateJournalEntry(input: ResolveUserEntitlementInput): boolean {
  return resolveUserEntitlement(input).canUseContinuedFeatures;
}

export function canUseContinuedFeatures(input: ResolveUserEntitlementInput): boolean {
  return resolveUserEntitlement(input).canUseContinuedFeatures;
}

export function serializeUserEntitlement(entitlement: UserEntitlement): SerializedUserEntitlement {
  return {
    tier: entitlement.tier,
    showTrialBanner: entitlement.showTrialBanner,
    bannerVariant: entitlement.bannerVariant,
    canUseContinuedFeatures: entitlement.canUseContinuedFeatures,
    canCreateFirstJournal: entitlement.canCreateFirstJournal,
    trialDaysRemaining: entitlement.trialDaysRemaining,
    trialDayIndex: entitlement.trialDayIndex,
  };
}

export function continuedFeaturesDeniedMessage(_entitlement: UserEntitlement): string {
  return "この操作はご利用いただけません。どんぐりと森の定期便のご案内をご確認ください。";
}

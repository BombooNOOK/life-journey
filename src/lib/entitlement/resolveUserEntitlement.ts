import { resolveOfficialLaunchDate } from "@/lib/entitlement/officialLaunchDate";
import {
  FREE_TRIAL_DAYS,
  FREE_TRIAL_WARNING_START_DAY,
  isWithinTrial,
  trialDayIndex,
  trialDaysRemaining,
} from "@/lib/entitlement/trialDuration";
import { TRIAL_COPY, TRIAL_CONTINUED_FEATURES_DENIED_MESSAGE } from "@/lib/entitlement/trialStatusCopy";
import { isStripeSubscriptionEntitled } from "@/lib/stripe/plans";

export type EntitlementAccountSettings = {
  isAdmin?: boolean | null;
  isMonitor?: boolean | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  freeTrialStartedAt?: Date | null;
};

export type ResolveUserEntitlementInput = {
  settings: EntitlementAccountSettings | null;
  journalEntryCount: number;
  now?: Date;
};

export type EntitlementTier =
  | "admin"
  | "monitor"
  | "subscriber"
  | "trial_not_started"
  | "trial_active"
  | "trial_warning"
  | "trial_expired";

export type TrialBannerVariant = "none" | "not_started" | "warning" | "expired";

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

function exemptResult(tier: "admin" | "monitor" | "subscriber"): UserEntitlement {
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

function expiredResult(now: Date, startedAt: Date): UserEntitlement {
  const dayIndex = trialDayIndex(startedAt, now);
  return {
    hasFullAccess: false,
    canUseContinuedFeatures: false,
    canCreateFirstJournal: false,
    tier: "trial_expired",
    showTrialBanner: true,
    bannerVariant: "expired",
    trialDaysRemaining: 0,
    trialDayIndex: dayIndex,
    denialCode: "FREE_TRIAL_EXPIRED",
    denialMessage: TRIAL_COPY.expired.body,
  };
}

export function resolveUserEntitlement(input: ResolveUserEntitlementInput): UserEntitlement {
  const now = input.now ?? new Date();
  const settings = input.settings;
  const count = input.journalEntryCount;

  if (settings?.isAdmin === true) return exemptResult("admin");
  if (settings?.isMonitor === true) return exemptResult("monitor");
  if (isPaidSubscriber(settings)) return exemptResult("subscriber");

  const startedAt = settings?.freeTrialStartedAt ?? null;

  if (startedAt === null && count === 0) {
    return {
      hasFullAccess: true,
      canUseContinuedFeatures: false,
      canCreateFirstJournal: true,
      tier: "trial_not_started",
      showTrialBanner: false,
      bannerVariant: "none",
      trialDaysRemaining: null,
      trialDayIndex: null,
      denialCode: null,
      denialMessage: null,
    };
  }

  const effectiveStartedAt = startedAt ?? resolveOfficialLaunchDate();

  if (!isWithinTrial(effectiveStartedAt, now)) {
    return expiredResult(now, effectiveStartedAt);
  }

  const dayIndex = trialDayIndex(effectiveStartedAt, now);
  const isWarning = dayIndex >= FREE_TRIAL_WARNING_START_DAY && dayIndex <= FREE_TRIAL_DAYS;

  return {
    hasFullAccess: true,
    canUseContinuedFeatures: true,
    canCreateFirstJournal: count === 0,
    tier: isWarning ? "trial_warning" : "trial_active",
    showTrialBanner: isWarning,
    bannerVariant: isWarning ? "warning" : "none",
    trialDaysRemaining: trialDaysRemaining(effectiveStartedAt, now),
    trialDayIndex: dayIndex,
    denialCode: null,
    denialMessage: null,
  };
}

export function canCreateJournalEntry(input: ResolveUserEntitlementInput): boolean {
  const entitlement = resolveUserEntitlement(input);
  if (entitlement.canUseContinuedFeatures) return true;
  return entitlement.canCreateFirstJournal;
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

export function continuedFeaturesDeniedMessage(entitlement: UserEntitlement): string {
  if (entitlement.tier === "trial_not_started") {
    return "この操作は、日記の無料お試し開始後にご利用いただけます。";
  }
  return entitlement.denialMessage ?? TRIAL_CONTINUED_FEATURES_DENIED_MESSAGE;
}

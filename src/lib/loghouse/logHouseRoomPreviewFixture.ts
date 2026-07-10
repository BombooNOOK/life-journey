import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";

export const LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID = "preview-profile" as const;

export const LOG_HOUSE_ROOM_PREVIEW_ENTITLEMENT: SerializedUserEntitlement = {
  tier: "subscriber",
  showTrialBanner: false,
  bannerVariant: "none",
  canUseContinuedFeatures: true,
  canCreateFirstJournal: true,
  trialDaysRemaining: null,
  trialDayIndex: null,
};

export const LOG_HOUSE_ROOM_PREVIEW_PROFILES = [
  { id: LOG_HOUSE_ROOM_PREVIEW_PROFILE_ID, nickname: "さくら" },
] as const;

/** プレビュー用の鑑定結果リンク（本番では実 ID に差し替わる） */
export const LOG_HOUSE_ROOM_PREVIEW_KANTEI_ORDER_ID = "preview-kantei-order";

export const LOG_HOUSE_ROOM_PREVIEW_COMPANION_HREF =
  "/journal/with-companion?returnTo=%2Fpreview%2Floghouse-room";

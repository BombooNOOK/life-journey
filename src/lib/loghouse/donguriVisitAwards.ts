/**
 * AI-X6.7C1.5A2-I3.6 — Explicit Donguri visit awards (daily + birthday).
 *
 * Must ONLY be invoked from authenticated mutation paths (POST), never from
 * GET / Server Component render / prefetch / layout evaluation.
 */

import {
  ensureBirthdayAcornGift,
  ensureDailyAcornDelivery,
  getDonguriChoView,
  type DonguriAwardOwnershipDeps,
  type DonguriChoView,
} from "@/lib/loghouse/donguriLedger";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

export type DonguriVisitAwardsResult = {
  profileId: string | null;
  dailyDelivered: boolean;
  birthdayDelivered: boolean;
  cho: DonguriChoView;
};

/**
 * Server-resolved viewer awards for an actual /orders visit.
 * Caller supplies authenticated viewer email only — never client identityId.
 */
export async function runDonguriVisitAwardsForViewer(params: {
  viewerEmail: string;
  now?: Date;
  /** Test/harness only — production callers omit (server resolves active profile). */
  resolveProfileId?: (email: string) => Promise<string>;
  /** Test only — inject ownership resolution without Next cookies(). */
  ownershipDeps?: DonguriAwardOwnershipDeps;
}): Promise<DonguriVisitAwardsResult> {
  const email = params.viewerEmail.trim().toLowerCase();
  const emptyCho: DonguriChoView = { balance: 0, todayDelivery: null, recent: [] };
  if (!email) {
    return {
      profileId: null,
      dailyDelivered: false,
      birthdayDelivered: false,
      cho: emptyCho,
    };
  }

  const profileId = params.resolveProfileId
    ? await params.resolveProfileId(email)
    : await resolveActiveProfileId(email);
  if (!profileId) {
    return {
      profileId: null,
      dailyDelivered: false,
      birthdayDelivered: false,
      cho: emptyCho,
    };
  }

  const daily = await ensureDailyAcornDelivery({
    email,
    profileId,
    now: params.now,
    ownershipDeps: params.ownershipDeps,
  });
  const birthday = await ensureBirthdayAcornGift({
    email,
    activeProfileId: profileId,
    now: params.now,
  });
  const cho = await getDonguriChoView({ email, profileId });

  return {
    profileId,
    dailyDelivered: daily.delivered,
    birthdayDelivered: birthday.delivered,
    cho,
  };
}

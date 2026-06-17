import Link from "next/link";

import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { MyPageManageHub } from "@/components/orders/MyPageManageMenu";
import { MyPageMainActions } from "@/components/orders/MyPageMainActions";
import { MyPagePageHeader } from "@/components/orders/MyPagePageHeader";
import { MyPageProfileList } from "@/components/orders/MyPageProfileList";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
  type SerializedUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">ログイン情報を確認できませんでした</p>
          <p className="mt-2">いちどログアウトして、もう一度ログインしてください。</p>
        </div>
      </div>
    );
  }

  const viewerIsAdmin = await isAdminEmail(viewerEmail);

  let profiles: Awaited<ReturnType<typeof listProfilesAndActiveProfileId>>["profiles"] = [];
  let activeProfileId = "";
  let fetchError: string | null = null;
  let hasKanteiOrder = true;
  let activeKanteiOrderId: string | null = null;
  let entitlement: SerializedUserEntitlement = {
    tier: "trial_not_started",
    showTrialBanner: false,
    bannerVariant: "none",
    canUseContinuedFeatures: false,
    canCreateFirstJournal: true,
    trialDaysRemaining: null,
    trialDayIndex: null,
  };
  try {
    const loaded = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );
    profiles = loaded.profiles;
    activeProfileId = loaded.activeProfileId;
    if (activeProfileId) {
      const kanteiOrder = await withPrismaConnectionRetry(() =>
        findKanteiOrderForProfile({ viewerEmail, profileId: activeProfileId }),
      );
      hasKanteiOrder = kanteiOrder != null;
      activeKanteiOrderId = kanteiOrder?.id ?? null;
    }
    const entitlementCtx = await withPrismaConnectionRetry(() =>
      loadEntitlementContext(viewerEmail),
    );
    entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "一覧を取得できませんでした。";
  }

  if (fetchError) {
    const showDevHint = process.env.NODE_ENV === "development";
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">マイページ</h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">マイページを読み込めませんでした</p>
          <p className="mt-2 text-stone-800">
            まずは下の「詳細」を確認してください（ここに出ている内容が、実際の原因に近いです）。接続の一時切れのときは、数分あけてから再読み込みしてください。
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-red-800">詳細</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-red-200/80 bg-white/80 px-3 py-2 font-mono text-xs text-red-950">
            {fetchError}
          </p>
          {!showDevHint ? (
            <p className="mt-3 text-xs text-red-800">
              本番で続く場合は、Vercel の `DATABASE_URL` が Neon の<strong>プーラー用</strong>
              接続になっているか、未適用のマイグレーションがないかを確認してください。
            </p>
          ) : (
            <p className="mt-3 text-xs text-red-800">
              開発時: `DATABASE_URL` と `npx prisma db push` / `migrate` を確認してください。
            </p>
          )}
        </div>
      </div>
    );
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
      <div className="space-y-5 sm:space-y-6">
      <MyPagePageHeader />

      <MyPageProfileList profiles={profiles} activeProfileId={activeProfileId} />

      <TrialStatusBanner entitlement={entitlement} />

      {activeProfile && !hasKanteiOrder ? (
        <KanteiMissingBanner
          profileId={activeProfile.id}
          blockNewKantei={!entitlement.canUseContinuedFeatures}
        />
      ) : null}

      {activeProfile ? (
        <MyPageMainActions
          profileId={activeProfile.id}
          isActive
          entitlement={entitlement}
          kanteiOrderId={activeKanteiOrderId}
        />
      ) : null}

      <MyPageManageHub activeProfileId={activeProfileId || null} />

      <div className="border-t border-stone-200 pt-6">
        <LegalFooterLinks />
      </div>

      {viewerIsAdmin ? (
        <div className="border-t border-stone-200 pt-6">
          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            管理者ページへ
          </Link>
        </div>
      ) : null}

      </div>
  );
}

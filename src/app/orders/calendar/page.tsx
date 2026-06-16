import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DiaryCalendarHome } from "@/components/journal/DiaryCalendarHome";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";

export const dynamic = "force-dynamic";

function CalendarFallback() {
  return <p className="text-sm text-stone-500">カレンダーを読み込み中…</p>;
}

export default async function OrdersCalendarPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/calendar");
  }

  let profiles: Awaited<ReturnType<typeof listProfilesAndActiveProfileId>>["profiles"] = [];
  let activeProfileId = "";
  try {
    const loaded = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );
    profiles = loaded.profiles;
    activeProfileId = loaded.activeProfileId;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "プロフィール情報を読み込めませんでした。";
    return (
      <div className="space-y-4">
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページ
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          プロフィール情報を読み込めませんでした。しばらくしてから再度お試しください。
        </p>
        <details className="rounded-lg border border-red-200/80 bg-white px-3 py-2 text-xs text-stone-700">
          <summary className="cursor-pointer select-none font-medium text-stone-700">
            詳細（原因の確認）
          </summary>
          <p className="mt-2 whitespace-pre-wrap rounded-md border border-red-200/70 bg-red-50/40 px-3 py-2 font-mono text-[11px] text-red-900">
            {detail}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
            例：DB の接続上限や転送量の上限に達している場合、再読み込みしても同じエラーが続きます。
          </p>
        </details>
      </div>
    );
  }

  const activeProfileNickname =
    profiles.find((p) => p.id === activeProfileId)?.nickname ?? "メイン";

  const entitlementCtx = await withPrismaConnectionRetry(() =>
    loadEntitlementContext(viewerEmail),
  );
  const entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));

  return (
    <Suspense fallback={<CalendarFallback />}>
      <DiaryCalendarHome
        profiles={profiles}
        activeProfileId={activeProfileId}
        activeProfileNickname={activeProfileNickname}
        entitlement={entitlement}
      />
    </Suspense>
  );
}

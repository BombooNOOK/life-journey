import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProfileDetailActiveSync } from "@/components/profile/ProfileDetailActiveSync";
import { ProfileNicknameEditor } from "@/components/profile/ProfileNicknameEditor";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  journalProfileIdsForQuery,
  listProfilesAndActiveProfileId,
  profileByIdForViewer,
} from "@/lib/profile/activeProfile";
import { parseProfileIdFromRouteParam } from "@/lib/profile/parseProfileIdFromRouteParam";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ profileId: string }>;
};

export default async function ProfileDetailPage({ params }: Props) {
  const { profileId: profileIdRaw } = await params;
  const profileId = parseProfileIdFromRouteParam(profileIdRaw);
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders");
  }

  const profile = await withPrismaConnectionRetry(() =>
    profileByIdForViewer(profileId, viewerEmail),
  );
  if (!profile) {
    notFound();
  }

  const normalizedEmail = normalizeEmail(viewerEmail);
  const orderProfileIds = journalProfileIdsForQuery(profileId, normalizedEmail);

  const [{ activeProfileId }, orders] = await withPrismaConnectionRetry(() =>
    Promise.all([
      listProfilesAndActiveProfileId(viewerEmail),
      prisma.order.findMany({
        where: { email: viewerEmail, profileId: { in: orderProfileIds } },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          fullNameDisplay: true,
          createdAt: true,
        },
      }),
    ]),
  );

  const isActive = activeProfileId === profileId;
  const hasKantei = orders.length > 0;

  return (
    <div className="space-y-6">
      <ProfileDetailActiveSync profileId={profile.id} isActive={isActive} />
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{profile.nickname}</h1>
        <p className="mt-1 text-sm text-stone-600">名前の変更と、保存済み鑑定の一覧です。</p>
        <p className="mt-2 text-xs text-stone-500">
          {isActive ? "現在選択中のプロフィールです。" : "表示を切り替えています。"}
        </p>
      </div>

      <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
        「日記を書く」「本棚を見る」は
        <Link href="/orders#main-actions" className="font-medium text-emerald-900 underline-offset-2 hover:underline">
          マイページ
        </Link>
        から開けます。
      </p>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">プロフィール情報</h2>
        <ProfileNicknameEditor profileId={profile.id} initialNickname={profile.nickname} />
        <dl className="space-y-2 border-t border-stone-100 pt-3 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-28 shrink-0 text-stone-500">プロフィールID</dt>
            <dd className="break-all text-stone-700">{profile.id}</dd>
          </div>
        </dl>
      </section>

      <section id="saved-orders" className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">保存済み鑑定</h2>
        {hasKantei ? (
          <p className="text-xs text-stone-500">
            このプロフィールには既に鑑定書があります。追加の無料鑑定は作成できません。
          </p>
        ) : null}
        {orders.length === 0 ? (
          <div className="space-y-2 text-sm text-stone-600">
            <p>このプロフィールにはまだ保存済み鑑定がありません。</p>
            <Link
              href={`/order?profile=${encodeURIComponent(profile.id)}`}
              className="inline-flex font-medium text-amber-900 underline-offset-2 hover:underline"
            >
              無料鑑定を作成する
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-medium text-stone-900 hover:underline">
                    {order.fullNameDisplay}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {order.createdAt.toLocaleString("ja-JP")}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`} className="text-sm text-stone-600 hover:text-stone-900">
                  詳細 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderIdentityCorrectionCard } from "@/components/orders/OrderIdentityCorrectionCard";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderManagePage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) notFound();

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();
  if (normalizeEmail(order.email) !== viewerEmail) notFound();

  const canCorrectIdentity = (order.identityCorrectionCount ?? 0) === 0;

  return (
    <div className="space-y-5">
      <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
        ← 本棚へ戻る
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-stone-900">鑑定情報の管理</h1>
        <p className="mt-1 text-sm text-stone-600">
          お名前・生年月日の修正が必要な場合は、この画面から操作してください。
        </p>
      </div>

      <OrderIdentityCorrectionCard
        orderId={order.id}
        initialLastName={order.lastName}
        initialFirstName={order.firstName}
        initialLastNameKana={order.lastNameKana}
        initialFirstNameKana={order.firstNameKana}
        initialBirthYear={order.birthYear}
        initialBirthMonth={order.birthMonth}
        initialBirthDay={order.birthDay}
        canCorrect={canCorrectIdentity}
      />

      <p className="text-xs text-stone-500">
        鑑定結果の確認は「鑑定結果を見る」、PDF閲覧・保存・製本注文は本棚カードの「概要」から行えます。
      </p>
    </div>
  );
}

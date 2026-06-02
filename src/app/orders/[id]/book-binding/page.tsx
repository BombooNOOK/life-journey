import Link from "next/link";
import { notFound } from "next/navigation";

import { KanteiBookBindingConfirmButton } from "@/components/orders/KanteiBookBindingConfirmButton";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { resolveOrderKanteiCodeSafe } from "@/lib/order/kanteiCode";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KanteiBookBindingConfirmPage({ params }: Props) {
  const { id } = await params;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) notFound();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || normalizeEmail(order.email) !== viewerEmail) notFound();

  const kanteiCode = await resolveOrderKanteiCodeSafe(order.id, "book-binding-confirm");

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/orders/${order.id}`} className="text-sm text-stone-600 hover:text-stone-900">
          ← 鑑定詳細
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">鑑定書 製本版のご注文</h1>
        <p className="mt-1 text-sm text-stone-600">
          鑑定書PDFを一冊の本として製本し、お届けするオプションです（2,980円・税込・送料込）。
        </p>
      </div>

      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 text-sm text-stone-800">
        <h2 className="font-semibold text-stone-900">注文対象の鑑定書</h2>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-xs text-stone-500">鑑定コード</dt>
            <dd className="font-mono font-medium">{kanteiCode ?? "（取得中）"}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">対象者名</dt>
            <dd>{order.fullNameDisplay}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">生年月日</dt>
            <dd>{order.birthDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">鑑定作成日</dt>
            <dd>{order.createdAt.toLocaleString("ja-JP")}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-stone-700">
          この鑑定書を、紙の本として注文できます。
          <br />
          ボタンを押すと、注文用の記録を作成してからBASEの商品ページへ移動します。
          <br />
          鑑定コードは自動で記録されるため、コピーは不要です。
        </p>
      </section>

      <KanteiBookBindingConfirmButton orderId={order.id} />

      <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-stone-500">
        <li>BASEの商品ページでお支払いします。</li>
        <li>受注生産のため、注文後のキャンセルは原則できません。</li>
        <li>月額プランとは別料金です。</li>
      </ul>
    </div>
  );
}

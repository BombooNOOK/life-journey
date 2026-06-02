import Link from "next/link";
import { notFound } from "next/navigation";

import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  resolveKanteiPdfDownloadFilename,
  resolveOrderKanteiCodeSafe,
} from "@/lib/order/kanteiCode";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderPdfPreviewPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) notFound();
  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, email: true, fullNameDisplay: true, kanteiCode: true },
  });
  if (!order) notFound();
  if (normalizeEmail(order.email) !== viewerEmail) notFound();

  const kanteiCode = order.kanteiCode ?? (await resolveOrderKanteiCodeSafe(order.id, "pdf-preview"));
  const previewHref = `/api/orders/${orderId}/pdf?download=0&quality=low`;
  const previewFrameHref = `${previewHref}#view=FitH&toolbar=1&navpanes=0&statusbar=0`;
  const downloadHref = `/api/orders/${orderId}/pdf?download=1&quality=low`;
  const downloadFileName = resolveKanteiPdfDownloadFilename(order.id, kanteiCode, "preview");

  return (
    <div className="space-y-4">
      <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
        ← 本棚へ戻る
      </Link>

      <h1 className="text-xl font-semibold text-stone-900">{order.fullNameDisplay} さんの鑑定書</h1>
      <p className="text-sm leading-relaxed text-stone-600">
        鑑定書は PDF 形式です。日記ブックのようなめくりビューワーではなく、
        <strong className="font-medium text-stone-800">お使いのブラウザの PDF 表示</strong>
        で読むのがいちばん見やすくなります（スマホでも同様です）。
      </p>

      <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
        <a
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900"
        >
          目次つきPDFで読む（推奨）
        </a>
        <p className="text-center text-[11px] text-stone-600">
          目次リンクつき。気になる章へすぐ移動できます。
        </p>
        <p className="text-center text-[11px] text-stone-600">
          プレビュー閲覧（`download=0`）はダウンロード回数に加算されません。
        </p>

        <PdfDownloadButton
          href={downloadHref}
          label="PDFを端末に保存"
          className="inline-flex w-full justify-center rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-50"
          loadingLabel="PDFを準備しています。初回は30秒〜数分かかることがあります。"
          suggestedFileName={downloadFileName}
        />
        <p className="text-center text-[11px] text-stone-600">
          保存はダウンロード回数を1回消費します。保存後は「ファイル」アプリなどで開いてください。
        </p>
      </div>

      <div className="hidden overflow-auto rounded-xl border border-stone-200 bg-white md:block">
        <p className="border-b border-stone-100 px-3 py-2 text-xs text-stone-500">
          PC向け：ページ内プレビュー（うまく表示されない場合は上の「目次つきPDFで読む」をご利用ください）
        </p>
        <iframe
          title="鑑定書PDFプレビュー"
          src={previewFrameHref}
          className="h-[75vh] min-h-[480px] w-full"
        />
      </div>
    </div>
  );
}

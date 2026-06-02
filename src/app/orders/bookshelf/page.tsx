import Link from "next/link";
import { redirect } from "next/navigation";

import { BookshelfBookCard, type BookshelfBookDetailRow } from "@/components/orders/BookshelfBookCard";
import { BookshelfPageHeader } from "@/components/orders/BookshelfPageHeader";
import { DiaryBookCreateForm } from "@/components/orders/DiaryBookCreateForm";
import { isAdminEmail } from "@/lib/admin/access";
import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listDiaryBooksForViewer } from "@/lib/journal/listDiaryBooks";
import { diaryCoverImagePath, getDiaryCoverStyleLabel } from "@/lib/journal/coverAssets";
import { resolveDiaryBookBindingOffer } from "@/lib/journal/diaryBookBindingOffer";
import { listJournalEntriesForDiaryBookRow } from "@/lib/journal/listDiaryBookEntries";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { combinePdfDownloadLimit, fetchAccountPdfDownloadLimitOrNull } from "@/lib/order/effectivePdfDownloadLimit";
import {
  resolveKanteiPdfDownloadFilename,
  resolveOrderKanteiCodeSafe,
} from "@/lib/order/kanteiCode";

export const dynamic = "force-dynamic";

export default async function BookshelfPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  try {
    const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
      listProfilesAndActiveProfileId(viewerEmail),
    );
    const activeProfileLabel =
      profiles.find((p) => p.id === activeProfileId)?.nickname ?? "メイン";
    const viewerIsAdmin = await isAdminEmail(viewerEmail);
    const showPrintQualityPdf = viewerIsAdmin;
    const accountPdfCap = await fetchAccountPdfDownloadLimitOrNull(viewerEmail);

    const [orders, diaryBookRows] = await Promise.all([
      prisma.order.findMany({
        where: { email: viewerEmail, profileId: activeProfileId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          kanteiCode: true,
          fullNameDisplay: true,
          fullNameRomanDisplay: true,
          createdAt: true,
          pdfDownloadCount: true,
          pdfDownloadLimit: true,
        },
      }),
      listDiaryBooksForViewer({
        email: viewerEmail,
        profileId: activeProfileId,
      }),
    ]);

    const diaryBookCards = await Promise.all(
      diaryBookRows.map(async (book) => {
        const entries = await listJournalEntriesForDiaryBookRow({
          book: {
            email: viewerEmail,
            profileId: activeProfileId,
            startDate: book.startDate,
            endDate: book.endDate,
          },
          viewerEmail,
        });
        const bindingOffer = resolveDiaryBookBindingOffer(
          entries,
          book.startDate,
          book.endDate,
        );
        const rangeLabel = `${book.startDate.replace(/-/g, "/")} 〜 ${book.endDate.replace(/-/g, "/")}`;
        const details: BookshelfBookDetailRow[] = [
          { label: "期間", value: rangeLabel },
          { label: "記録数", value: `${book.entryCount}件` },
          { label: "表紙", value: getDiaryCoverStyleLabel(book.coverTheme) },
          {
            label: "作成日",
            value: new Date(book.createdAt).toLocaleDateString("ja-JP"),
          },
          { label: "製本対象", value: bindingOffer.overviewBindingValue },
        ];
        return {
          id: `diary-book-${book.id}`,
          kind: "diary-book" as const,
          title: book.title,
          href: `/orders/bookshelf/diary-book/${book.id}`,
          tone: "emerald" as const,
          coverImageSrc: diaryCoverImagePath(book.coverTheme, "owl"),
          coverAlt: `${book.title}の表紙`,
          details,
          bindingLabel: "製本版を注文する",
          bindingHref: `/orders/bookshelf/diary-book/${book.id}/book-binding`,
        };
      }),
    );

    const reportCards = await Promise.all(
      orders.map(async (order) => {
        const kanteiCode =
          order.kanteiCode ?? (await resolveOrderKanteiCodeSafe(order.id, "bookshelf"));
        const effectiveLimit = combinePdfDownloadLimit(order.pdfDownloadLimit, accountPdfCap);
        const remaining = Math.max(0, effectiveLimit - (order.pdfDownloadCount ?? 0));
        const createdLabel = order.createdAt.toLocaleDateString("ja-JP");
        const details: BookshelfBookDetailRow[] = [
          { label: "お名前", value: order.fullNameDisplay },
          { label: "作成日", value: createdLabel },
          { label: "PDF形式", value: "目次リンクつき軽量PDF（ブラウザ表示対応）" },
          {
            label: "ダウンロード",
            value: `ダウンロード残り ${remaining} / ${effectiveLimit} 回`,
          },
        ];
        const previewPdfHref = `/api/orders/${order.id}/pdf?download=0&quality=low`;
        const boundPdfHref = `/api/orders/${order.id}/pdf?download=1&quality=low`;
        const overviewExtra = (
          <>
            <PdfDownloadButton
              href={boundPdfHref}
              label="PDFをダウンロード（端末に保存）"
              className="inline-flex w-full justify-center rounded-lg bg-amber-800 px-3 py-2 text-xs font-medium text-white hover:bg-amber-900"
              loadingLabel="タップ後にブラウザが受け取ります。初回は30秒〜数分かかることがあります。"
              suggestedFileName={resolveKanteiPdfDownloadFilename(order.id, kanteiCode, "preview")}
            />
            {showPrintQualityPdf ? (
              <PdfDownloadButton
                href={`/api/orders/${order.id}/pdf?download=1&quality=high`}
                label="製本用PDFをダウンロード（端末に保存）"
                className="inline-flex w-full justify-center rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100"
                loadingLabel="高画質は1〜3分かかることがあります。画面を閉じずにお待ちください。"
                suggestedFileName={resolveKanteiPdfDownloadFilename(order.id, kanteiCode, "print")}
              />
            ) : null}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link
                href={`/orders/${order.id}/manage`}
                className="text-xs font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                入力内容を修正する
              </Link>
              <Link
                href="/help/pdf-download"
                className="text-xs text-stone-600 underline-offset-2 hover:underline"
              >
                DL方法（PC / スマホ）
              </Link>
            </div>
            <p className="text-[11px] leading-snug text-stone-500">
              PDFの生成に1分ほどかかることがあります。混雑時は時間をおいて再試行してください。
            </p>
          </>
        );
        const romanizedName = order.fullNameRomanDisplay?.trim() || order.fullNameDisplay;
        return {
          id: `report-${order.id}`,
          kind: "report" as const,
          title: `鑑定書（${romanizedName}）`,
          href: previewPdfHref,
          readButtonLabel: "PDFで読む",
          quickPreviewHref: `/orders/${order.id}`,
          quickPreviewLabel: "鑑定結果を見る",
          quickPreviewHelpText: "目次リンクつき。気になる章へすぐ移動できます。",
          quickPreviewOpenInNewTab: false,
          bindingHref: `/orders/${order.id}/book-binding`,
          bindingLabel: "製本版を注文する",
          tone: "amber" as const,
          coverImageSrc: "/images/kantei-cover.png?v=1",
          coverAlt: "鑑定書の表紙",
          details,
          overviewExtra,
        };
      }),
    );

    const books = [...diaryBookCards, ...reportCards];

    return (
      <div className="space-y-5">
        <BookshelfPageHeader activeProfileLabel={activeProfileLabel} />

        <DiaryBookCreateForm />

        {diaryBookCards.length === 0 ? (
          <p className="text-xs text-stone-500">
            まだ日記ブックはありません。「本にする」から作成すると、ここに並びます。
          </p>
        ) : null}

        {books.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
            <p>まだ本棚に並べる本がありません。</p>
            <p className="mt-2 text-xs text-stone-500">
              日記ブックは「本にする」から、鑑定書は鑑定作成後に表示されます。
            </p>
          </div>
        ) : (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookshelfBookCard key={book.id} {...book} />
            ))}
          </ul>
        )}
      </div>
    );
  } catch (e) {
    console.error("[orders/bookshelf]", e);
    return (
      <div className="space-y-4 p-4">
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページへ
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-semibold">本棚を表示できませんでした</p>
          <p className="mt-2 text-stone-700">
            時間をおいて再度お試しください。続く場合は、データベースのマイグレーション（`npx prisma migrate deploy`）が未適用の可能性があります。
          </p>
        </div>
      </div>
    );
  }
}

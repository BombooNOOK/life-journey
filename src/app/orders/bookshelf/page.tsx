import Link from "next/link";
import { redirect } from "next/navigation";

import { BookshelfBookCard, type BookshelfBookDetailRow } from "@/components/orders/BookshelfBookCard";
import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { BookshelfPageHeader } from "@/components/orders/BookshelfPageHeader";
import { DiaryBookCreateForm } from "@/components/orders/DiaryBookCreateForm";
import { DiaryBookDeleteButton } from "@/components/orders/DiaryBookDeleteButton";
import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { isAdminEmail } from "@/lib/admin/access";
import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { profileHasKanteiOrder } from "@/lib/journal/kanteiCommentEligibility";
import { listDiaryBooksForViewer } from "@/lib/journal/listDiaryBooks";
import { diaryCoverImagePath, getDiaryCoverStyleLabel } from "@/lib/journal/coverAssets";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { combinePdfDownloadLimit, fetchAccountPdfDownloadLimitOrNull } from "@/lib/order/effectivePdfDownloadLimit";
import { resolveKanteiPdfDownloadFilename } from "@/lib/order/kanteiCode";
import { loadEntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import {
  resolveUserEntitlement,
  serializeUserEntitlement,
} from "@/lib/entitlement/resolveUserEntitlement";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";

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
    const entitlementCtx = await loadEntitlementContext(viewerEmail);
    const entitlement = serializeUserEntitlement(resolveUserEntitlement(entitlementCtx));
    const canUseContinuedFeatures = entitlement.canUseContinuedFeatures;

    const [orders, diaryBookRows, hasKanteiOrder] = await Promise.all([
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
      profileHasKanteiOrder(viewerEmail, activeProfileId),
    ]);

    const diaryBookCards = diaryBookRows.map((book) => {
      const rangeLabel = `${book.startDate.replace(/-/g, "/")} 〜 ${book.endDate.replace(/-/g, "/")}`;
      const bindingHint =
        book.entryCount > 0
          ? `${book.entryCount}件の記録（プランは概要で確認）`
          : "記録がありません";
      const details: BookshelfBookDetailRow[] = [
        { label: "期間", value: rangeLabel },
        { label: "記録数", value: `${book.entryCount}件` },
        { label: "表紙", value: getDiaryCoverStyleLabel(book.coverTheme) },
        {
          label: "作成日",
          value: new Date(book.createdAt).toLocaleDateString("ja-JP"),
        },
        { label: "製本対象", value: bindingHint },
      ];
      return {
        id: `diary-book-${book.id}`,
        kind: "diary-book" as const,
        title: book.title,
        periodLabel: rangeLabel,
        href: `/orders/bookshelf/diary-book/${book.id}`,
        tone: "emerald" as const,
        coverImageSrc: diaryCoverImagePath(book.coverTheme, "owl"),
        coverAlt: `${book.title}の表紙`,
        details,
        bindingLabel: canUseContinuedFeatures ? "製本版を注文する" : "製本版を注文する（要サブスク）",
        bindingHref: canUseContinuedFeatures
          ? `/orders/bookshelf/diary-book/${book.id}/book-binding`
          : "/plans",
        overviewExtra: (
          <>
            <BookshelfEditIncludesNavButton bookId={book.id}>
              <span className="block">本に入れる日記を編集する</span>
              {book.needsContentRefresh ? (
                <span className="mt-1 block text-[10px] font-normal text-amber-800">
                  日記の変更を本に反映できます
                </span>
              ) : null}
            </BookshelfEditIncludesNavButton>
            <div className="pt-1">
              <DiaryBookDeleteButton bookId={book.id} bookTitle={book.title} />
            </div>
          </>
        ),
      };
    });

    const reportCards = orders.map((order) => {
      const kanteiCode = order.kanteiCode ?? null;
      const effectiveLimit = combinePdfDownloadLimit(order.pdfDownloadLimit, accountPdfCap);
      const remaining = Math.max(0, effectiveLimit - (order.pdfDownloadCount ?? 0));
      const createdLabel = order.createdAt.toLocaleDateString("ja-JP");
      const details: BookshelfBookDetailRow[] = [
        { label: "お名前", value: order.fullNameDisplay },
        { label: "作成日", value: createdLabel },
        { label: "PDF形式", value: "目次リンクつき軽量PDF（アプリ内ビューア対応）" },
        {
          label: "ダウンロード",
          value: `ダウンロード残り ${remaining} / ${effectiveLimit} 回`,
        },
      ];
      const readHref = `/orders/${order.id}/read`;
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
            {canUseContinuedFeatures ? (
              <Link
                href={`/orders/${order.id}/manage`}
                className="text-xs font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                入力内容を修正する
              </Link>
            ) : null}
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
        href: readHref,
        readButtonLabel: "読む",
        readLoadingLabel: "鑑定書を開いています…",
        quickPreviewHref: `/orders/${order.id}`,
        quickPreviewLabel: "鑑定結果を見る",
        quickPreviewHelpText: "今日のヒントやコアナンバーの要約ページです。",
        quickPreviewOpenInNewTab: false,
        bindingHref: `/orders/${order.id}/book-binding`,
        bindingLabel: "製本版を注文する",
        tone: "amber" as const,
        coverImageSrc: "/images/kantei-cover.png?v=1",
        coverAlt: "鑑定書の表紙",
        details,
        overviewExtra,
      };
    });

    const books = [...diaryBookCards, ...reportCards];

    return (
        <div className="space-y-5">
        <BookshelfPageHeader
          activeProfileLabel={activeProfileLabel}
          deployRevision={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null}
        />

        <TrialStatusBanner entitlement={entitlement} />

        <DiaryBookCreateForm blockContinuedFeatures={!canUseContinuedFeatures} />

        {!hasKanteiOrder && activeProfileId ? (
          <KanteiMissingBanner profileId={activeProfileId} />
        ) : null}

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
          <ul
            id="bookshelf-diary-books"
            className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
          >
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

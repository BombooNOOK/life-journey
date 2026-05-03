import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveSubscriberPdfAccess } from "@/lib/account/pdfAccess";
import { isAdminEmail } from "@/lib/admin/access";
import { BookshelfDiaryBindingOrder } from "@/components/orders/BookshelfDiaryBindingOrder";
import { PdfDownloadButton } from "@/components/orders/PdfDownloadButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { journalEntryInBookshelfPeriod } from "@/lib/journal/bookshelfPeriod";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { combinePdfDownloadLimit, fetchAccountPdfDownloadLimitOrNull } from "@/lib/order/effectivePdfDownloadLimit";

export const dynamic = "force-dynamic";

type ShelfBook = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** チャプター挿入込みの製本PDF（`/api/orders/.../pdf`）。鑑定書のみ。 */
  boundPdfHref?: string;
  /** 鑑定書カードのみ。製本用（高画質）DLのための注文ID */
  reportOrderId?: string;
  pdfRemainingDownloads?: number;
  pdfDownloadLimit?: number;
  /** 日記カードのみ：その西暦年の製本カウント用 */
  diaryYear?: number;
  /** 製本ページ数の目安（記録件数）。日記カードのみ */
  pageCount?: number;
  tone: "amber" | "emerald";
};

export default async function BookshelfPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect("/login?returnTo=/orders/bookshelf");

  try {
  const { activeProfileId, profiles } = await withPrismaConnectionRetry(() =>
    listProfilesAndActiveProfileId(viewerEmail),
  );
  const activeProfileLabel =
    profiles.find((p) => p.id === activeProfileId)?.nickname ?? "メイン";
  const [subscriberPdf, viewerIsAdmin] = await Promise.all([
    resolveSubscriberPdfAccess(viewerEmail),
    isAdminEmail(viewerEmail),
  ]);
  const showPrintQualityPdf = subscriberPdf || viewerIsAdmin;
  const accountPdfCap = await fetchAccountPdfDownloadLimitOrNull(viewerEmail);
  const shelfBookDelegate = (prisma as unknown as {
    diaryBookshelfBook?: {
      findMany: (args: {
        where: { email: string; profileId: string };
        select: {
          year: boolean;
          displayTitle: boolean;
          periodStartMonth: boolean;
          periodEndMonth: boolean;
        };
      }) => Promise<
        {
          year: number;
          displayTitle: string | null;
          periodStartMonth: number;
          periodEndMonth: number;
        }[]
      >;
    };
  }).diaryBookshelfBook;

  const [orders, journalEntries, shelfBooks] = await Promise.all([
    prisma.order.findMany({
      where: { email: viewerEmail, profileId: activeProfileId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        fullNameDisplay: true,
        createdAt: true,
        pdfDownloadCount: true,
        pdfDownloadLimit: true,
      },
    }),
    prisma.journalEntry.findMany({
      where: { email: viewerEmail, profileId: activeProfileId },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, createdAt: true, includeInBook: true },
    }),
    shelfBookDelegate
      ? shelfBookDelegate.findMany({
          where: { email: viewerEmail, profileId: activeProfileId },
          select: {
            year: true,
            displayTitle: true,
            periodStartMonth: true,
            periodEndMonth: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const shelfByYear = new Map(
    shelfBooks.map((b) => [
      b.year,
      {
        displayTitle: b.displayTitle,
        periodStartMonth: b.periodStartMonth,
        periodEndMonth: b.periodEndMonth,
      },
    ]),
  );

  /** その年に「本に入れる」がONの記録がある（カード表示の対象年） */
  const diaryYearMeta = new Map<number, { firstId: string }>();
  for (const row of journalEntries) {
    if (!row.includeInBook) continue;
    const y = row.createdAt.getFullYear();
    if (!diaryYearMeta.has(y)) {
      diaryYearMeta.set(y, { firstId: row.id });
    }
  }

  const diaryBooks: ShelfBook[] = Array.from(diaryYearMeta.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([yearKey]) => {
      const shelf = shelfByYear.get(yearKey);
      const periodStart = shelf?.periodStartMonth ?? 1;
      const periodEnd = shelf?.periodEndMonth ?? 12;
      let count = 0;
      for (const row of journalEntries) {
        if (!row.includeInBook) continue;
        if (row.createdAt.getFullYear() !== yearKey) continue;
        if (
          !journalEntryInBookshelfPeriod(row.createdAt, yearKey, periodStart, periodEnd)
        ) {
          continue;
        }
        count += 1;
      }
      const title =
        shelf?.displayTitle?.trim() || `${yearKey}年の記録`;
      return {
        id: `diary-${yearKey}`,
        title,
        subtitle: `${count}件の記録`,
        href: `/orders/bookshelf/diary/${yearKey}`,
        diaryYear: yearKey,
        pageCount: count,
        tone: "emerald" as const,
      };
    });

  const reportBooks: ShelfBook[] = orders.map((order) => {
    const effectiveLimit = combinePdfDownloadLimit(order.pdfDownloadLimit, accountPdfCap);
    return {
      id: `report-${order.id}`,
      title: "鑑定書",
      subtitle: `${order.fullNameDisplay} · ${order.createdAt.toLocaleDateString("ja-JP")}`,
      href: `/orders/${order.id}`,
      reportOrderId: order.id,
      boundPdfHref: `/api/orders/${order.id}/pdf?download=1&quality=low`,
      pdfRemainingDownloads: Math.max(0, effectiveLimit - (order.pdfDownloadCount ?? 0)),
      pdfDownloadLimit: effectiveLimit,
      tone: "amber" as const,
    };
  });

  const books = [...diaryBooks, ...reportBooks];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">本棚</h1>
        <p className="mt-3 rounded-lg border border-violet-100 bg-violet-50/90 px-3 py-2 text-sm font-medium text-violet-950">
          表示中のプロフィール: 「{activeProfileLabel}」
        </p>
        <p className="mt-1 text-sm text-stone-600">
          あなたの「日記」と「鑑定書」を、本のように並べて管理できます。鑑定書はブラウザで読める製本レイアウトのPDFにもなります。
        </p>
      </div>

      {books.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
          まだ本棚に並べる本がありません。まずは記録や鑑定を作ってみましょう。
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <div
                className={[
                  "rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow",
                  book.tone === "emerald"
                    ? "border-emerald-200"
                    : "border-amber-200",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden
                    className={[
                      "grid h-14 w-11 shrink-0 place-items-center rounded-sm border text-lg",
                      book.tone === "emerald"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-amber-300 bg-amber-50",
                    ].join(" ")}
                  >
                    📕
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{book.title}</p>
                    <p className="mt-1 truncate text-xs text-stone-500">{book.subtitle}</p>
                    {book.boundPdfHref ? (
                      <div className="mt-3 space-y-2">
                        <PdfDownloadButton
                          href={book.boundPdfHref}
                          label="プレビュー版（軽量）"
                          className="inline-flex rounded-lg bg-amber-800 px-3 py-2 text-xs font-medium text-white hover:bg-amber-900"
                          loadingLabel="タップ後にブラウザが受け取ります。初回は30秒〜数分かかることがあります。"
                          suggestedFileName={
                            book.reportOrderId
                              ? `kantei-${book.reportOrderId.slice(0, 8)}-preview.pdf`
                              : undefined
                          }
                        />
                        {showPrintQualityPdf && book.reportOrderId ? (
                          <PdfDownloadButton
                            href={`/api/orders/${book.reportOrderId}/pdf?download=1&quality=high`}
                            label="製本用（高画質）"
                            className="inline-flex rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100"
                            loadingLabel="高画質は1〜3分かかることがあります。画面を閉じずにお待ちください。"
                            suggestedFileName={`kantei-${book.reportOrderId.slice(0, 8)}-print.pdf`}
                          />
                        ) : null}
                        {book.pdfRemainingDownloads != null && book.pdfDownloadLimit != null ? (
                          <div className="space-y-1">
                            <p className="text-[11px] leading-snug text-stone-500">
                              無料閲覧残り {book.pdfRemainingDownloads} / {book.pdfDownloadLimit} 回（閲覧・ダウンロード共通）
                            </p>
                            <p>
                              <Link
                                href="/help/pdf-download"
                                className="text-[11px] font-medium text-amber-900 underline-offset-2 hover:underline"
                              >
                                ダウンロード方法を見る（PC / スマホ）
                              </Link>
                            </p>
                          </div>
                        ) : null}
                        <div>
                          <Link
                            href={book.href}
                            className="text-xs font-medium text-amber-900 underline-offset-2 hover:underline"
                          >
                            概要ページ（コアナンバー・今日のヒントへ）
                          </Link>
                        </div>
                        <p className="text-[11px] leading-snug text-stone-500">
                          PDFの生成に1分ほどかかることがあります。
                        </p>
                      </div>
                    ) : book.diaryYear != null && book.pageCount != null ? (
                      <div className="space-y-2">
                        <BookshelfDiaryBindingOrder year={book.diaryYear} pageCount={book.pageCount} />
                        <Link
                          href={book.href}
                          className="inline-block text-xs font-medium text-stone-700 underline-offset-2 hover:underline"
                        >
                          この本を読む →
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={book.href}
                        className="mt-2 inline-block text-xs font-medium text-stone-700 underline-offset-2 hover:underline"
                      >
                        開く →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
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

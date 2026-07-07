import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { FirstVisitFlowBrowserBackGuard } from "@/components/orders/FirstVisitFlowBrowserBackGuard";
import { KanteiPdfReader } from "@/components/orders/KanteiPdfReader";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  resolveKanteiPdfDownloadFilename,
  resolveOrderKanteiCodeSafe,
} from "@/lib/order/kanteiCode";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { isKanteiFirstReadGuideMode } from "@/lib/pdf/kanteiFirstReadGuide";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guide?: string }>;
};

export const dynamic = "force-dynamic";

function ReaderFallback() {
  return (
    <OwlLoadingPanel
      layout="page"
      label="鑑定書ビューアを読み込んでいます…"
      hint="このあと鑑定書の準備が始まります。初回は30秒〜1分ほどかかることがあります。"
      className="min-h-[50vh]"
    />
  );
}

export default async function KanteiReadPage({ params, searchParams }: Props) {
  const { id: orderId } = await params;
  const { guide } = await searchParams;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect(`/login?returnTo=${encodeURIComponent(`/orders/${orderId}/read`)}`);

  const [{ activeProfileId }, order] = await Promise.all([
    listProfilesAndActiveProfileId(viewerEmail),
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        email: true,
        fullNameDisplay: true,
        fullNameRomanDisplay: true,
        kanteiCode: true,
      },
    }),
  ]);

  if (!order) notFound();
  if (normalizeEmail(order.email) !== viewerEmail) notFound();

  const kanteiCode = order.kanteiCode ?? (await resolveOrderKanteiCodeSafe(order.id, "read"));
  const romanizedName = order.fullNameRomanDisplay?.trim() || order.fullNameDisplay;
  const title = `鑑定書（${romanizedName}）`;
  const pdfPreviewHref = `/api/orders/${orderId}/pdf?download=0&quality=low`;
  const pdfDownloadHref = `/api/orders/${orderId}/pdf?download=1&quality=low`;
  const downloadFileName = resolveKanteiPdfDownloadFilename(order.id, kanteiCode, "preview");
  const guideMode = isKanteiFirstReadGuideMode(guide) ? guide : null;

  return (
    <div className="mx-auto max-w-3xl sm:px-0 max-sm:px-0 max-sm:pb-0 max-sm:pt-0">
      <Suspense fallback={<ReaderFallback />}>
        <FirstVisitFlowBrowserBackGuard kanteiFirstReadGuide={guideMode != null} />
        <KanteiPdfReader
          orderId={orderId}
          title={title}
          pdfPreviewHref={pdfPreviewHref}
          pdfDownloadHref={pdfDownloadHref}
          downloadFileName={downloadFileName}
          guideMode={guideMode}
          activeProfileId={activeProfileId ?? undefined}
        />
      </Suspense>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { KanteiPdfReader } from "@/components/orders/KanteiPdfReader";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";
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

function ReaderFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 py-12" role="status">
      <OwlSpinIndicator size="md" />
      <p className="text-sm text-stone-600">ビューアを読み込んでいます…</p>
    </div>
  );
}

export default async function KanteiReadPage({ params }: Props) {
  const { id: orderId } = await params;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) redirect(`/login?returnTo=${encodeURIComponent(`/orders/${orderId}/read`)}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      fullNameDisplay: true,
      fullNameRomanDisplay: true,
      kanteiCode: true,
    },
  });
  if (!order) notFound();
  if (normalizeEmail(order.email) !== viewerEmail) notFound();

  const kanteiCode = order.kanteiCode ?? (await resolveOrderKanteiCodeSafe(order.id, "read"));
  const romanizedName = order.fullNameRomanDisplay?.trim() || order.fullNameDisplay;
  const title = `鑑定書（${romanizedName}）`;
  const pdfPreviewHref = `/api/orders/${orderId}/pdf?download=0&quality=low`;
  const pdfDownloadHref = `/api/orders/${orderId}/pdf?download=1&quality=low`;
  const downloadFileName = resolveKanteiPdfDownloadFilename(order.id, kanteiCode, "preview");

  return (
    <div className="mx-auto max-w-3xl sm:px-0 max-sm:px-0 max-sm:pb-0 max-sm:pt-0">
      <Suspense fallback={<ReaderFallback />}>
        <KanteiPdfReader
          orderId={orderId}
          title={title}
          pdfPreviewHref={pdfPreviewHref}
          pdfDownloadHref={pdfDownloadHref}
          downloadFileName={downloadFileName}
        />
      </Suspense>
    </div>
  );
}

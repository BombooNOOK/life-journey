import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SupportInquiryMessageComposer } from "@/components/support/SupportInquiryMessageComposer";
import { SupportInquiryThread } from "@/components/support/SupportInquiryThread";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { serializeSupportInquiryMessage } from "@/lib/support/serializeSupportInquiryMessage";
import {
  SUPPORT_INQUIRY_CATEGORY_LABELS,
  SUPPORT_INQUIRY_STATUS_LABELS,
  type SupportInquiryCategory,
  type SupportInquiryStatus,
} from "@/lib/support/supportInquiryTypes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MyPageSupportInquiryDetailPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=%2Forders");
  }

  const { id } = await params;
  if (!id?.trim()) {
    notFound();
  }

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      category: true,
      status: true,
      replyChannel: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          role: true,
          body: true,
          authorEmail: true,
        },
      },
    },
  });

  if (!inquiry) {
    notFound();
  }

  const email = normalizeEmail(viewerEmail);
  if (inquiry.email !== email) {
    notFound();
  }

  if (inquiry.replyChannel === "email") {
    notFound();
  }

  const category = inquiry.category as SupportInquiryCategory;
  const status = inquiry.status as SupportInquiryStatus;
  const canReply = status !== "closed";
  const messages = inquiry.messages.map(serializeSupportInquiryMessage);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders/support" className="text-sm text-stone-600 hover:text-stone-900">
          ← お問い合わせ履歴
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">お問い合わせ詳細</h1>
        <p className="mt-1 text-sm text-stone-600">
          {SUPPORT_INQUIRY_CATEGORY_LABELS[category] ?? inquiry.category}
          <span className="mx-2 text-stone-300">·</span>
          {SUPPORT_INQUIRY_STATUS_LABELS[status] ?? inquiry.status}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          受付: {inquiry.createdAt.toLocaleString("ja-JP")}
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <SupportInquiryThread messages={messages} viewerRole="user" />

        {canReply ? (
          <SupportInquiryMessageComposer
            inquiryId={inquiry.id}
            apiPath={`/api/support/inquiries/${encodeURIComponent(inquiry.id)}/messages`}
            submitLabel="追加で送る"
            placeholder="追加のご質問やご連絡があれば入力してください"
          />
        ) : (
          <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-500">
            このお問い合わせは終了しています。新しい内容は、お問い合わせ履歴から再度お問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}

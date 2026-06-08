import Link from "next/link";
import { notFound } from "next/navigation";

import { SupportInquiryResolveButton } from "@/components/admin/SupportInquiryResolveButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
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

export default async function AdminSupportInquiryDetailPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const { id } = await params;
  if (!id?.trim()) {
    notFound();
  }

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      email: true,
      activeProfileId: true,
      activeProfileName: true,
      category: true,
      message: true,
      status: true,
    },
  });

  if (!inquiry) {
    notFound();
  }

  const category = inquiry.category as SupportInquiryCategory;
  const status = inquiry.status as SupportInquiryStatus;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/support-inquiries" className="text-sm text-stone-600 hover:text-stone-900">
          ← お問い合わせ一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">お問い合わせ詳細</h1>
        <p className="mt-1 text-sm text-stone-600">問い合わせ内容の全文を確認し、対応状況を更新できます。</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="text-stone-500">受付日時</dt>
          <dd className="text-stone-900">{inquiry.createdAt.toLocaleString("ja-JP")}</dd>

          <dt className="text-stone-500">メールアドレス</dt>
          <dd className="break-all text-stone-900">{inquiry.email}</dd>

          <dt className="text-stone-500">お問い合わせ種別</dt>
          <dd className="text-stone-900">
            {SUPPORT_INQUIRY_CATEGORY_LABELS[category] ?? inquiry.category}
          </dd>

          <dt className="text-stone-500">プロフィールID</dt>
          <dd className="font-mono text-xs text-stone-900">
            {inquiry.activeProfileId?.trim() || "—"}
          </dd>

          <dt className="text-stone-500">プロフィール名</dt>
          <dd className="text-stone-900">{inquiry.activeProfileName?.trim() || "—"}</dd>

          <dt className="text-stone-500">status</dt>
          <dd className="text-stone-900">{SUPPORT_INQUIRY_STATUS_LABELS[status] ?? inquiry.status}</dd>

          <dt className="text-stone-500">作成日時</dt>
          <dd className="text-stone-900">{inquiry.createdAt.toLocaleString("ja-JP")}</dd>

          <dt className="text-stone-500">更新日時</dt>
          <dd className="text-stone-900">{inquiry.updatedAt.toLocaleString("ja-JP")}</dd>
        </dl>

        <div className="mt-6 border-t border-stone-100 pt-5">
          <h2 className="text-sm font-semibold text-stone-900">本文</h2>
          <div className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-relaxed text-stone-800">
            {inquiry.message}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
          <SupportInquiryResolveButton inquiryId={inquiry.id} currentStatus={inquiry.status} />
          <Link
            href="/admin/support-inquiries"
            className="inline-flex min-h-[36px] items-center rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50"
          >
            一覧へ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

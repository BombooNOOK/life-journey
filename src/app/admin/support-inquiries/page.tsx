import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { SupportInquiryResolveButton } from "@/components/admin/SupportInquiryResolveButton";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";
import {
  SUPPORT_INQUIRY_CATEGORIES,
  SUPPORT_INQUIRY_CATEGORY_LABELS,
  SUPPORT_INQUIRY_STATUSES,
  SUPPORT_INQUIRY_STATUS_LABELS,
  truncateSupportInquiryMessagePreview,
  type SupportInquiryCategory,
  type SupportInquiryStatus,
} from "@/lib/support/supportInquiryTypes";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    category?: string;
    email?: string;
  }>;
};

function buildWhereClause(filters: {
  status?: string;
  category?: string;
  email?: string;
}): Prisma.SupportInquiryWhereInput {
  const where: Prisma.SupportInquiryWhereInput = {};
  const status = filters.status?.trim();
  const category = filters.category?.trim();
  const email = filters.email?.trim();

  if (status && (SUPPORT_INQUIRY_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }
  if (category && (SUPPORT_INQUIRY_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category;
  }
  if (email) {
    where.email = { contains: email, mode: "insensitive" };
  }
  return where;
}

export default async function AdminSupportInquiriesPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const params = await searchParams;
  const statusFilter = params.status?.trim() ?? "";
  const categoryFilter = params.category?.trim() ?? "";
  const emailFilter = params.email?.trim() ?? "";

  const rows = await prisma.supportInquiry.findMany({
    where: buildWhereClause({
      status: statusFilter,
      category: categoryFilter,
      email: emailFilter,
    }),
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      email: true,
      activeProfileName: true,
      category: true,
      message: true,
      status: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">お問い合わせ一覧</h1>
        <p className="mt-1 text-sm text-stone-600">
          マイページから送信されたお問い合わせを確認します。プロフィール削除依頼はここから受け付けています。
        </p>
      </div>

      <form
        action="/admin/support-inquiries"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-stone-600">
            status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={statusFilter}
            className="mt-1 rounded-md border border-stone-300 px-2 py-2 text-sm"
          >
            <option value="">すべて</option>
            {SUPPORT_INQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SUPPORT_INQUIRY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-stone-600">
            種別
          </label>
          <select
            id="filter-category"
            name="category"
            defaultValue={categoryFilter}
            className="mt-1 rounded-md border border-stone-300 px-2 py-2 text-sm"
          >
            <option value="">すべて</option>
            {SUPPORT_INQUIRY_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {SUPPORT_INQUIRY_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[12rem] flex-1">
          <label htmlFor="filter-email" className="block text-xs font-medium text-stone-600">
            メール（部分一致）
          </label>
          <input
            id="filter-email"
            name="email"
            type="text"
            defaultValue={emailFilter}
            placeholder="example@mail.com"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          絞り込む
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">受付日時</th>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">種別</th>
              <th className="px-4 py-3 font-medium">プロフィール名</th>
              <th className="px-4 py-3 font-medium">status</th>
              <th className="px-4 py-3 font-medium">本文</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-500">
                  お問い合わせはまだありません。
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const category = row.category as SupportInquiryCategory;
                const status = row.status as SupportInquiryStatus;
                return (
                  <tr key={row.id} className="border-t border-stone-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-stone-600">
                      {row.createdAt.toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 break-all text-stone-800">{row.email}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {SUPPORT_INQUIRY_CATEGORY_LABELS[category] ?? row.category}
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {row.activeProfileName?.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {SUPPORT_INQUIRY_STATUS_LABELS[status] ?? row.status}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-xs leading-relaxed text-stone-700">
                        {truncateSupportInquiryMessagePreview(row.message)}
                      </p>
                      <Link
                        href={`/admin/support-inquiries/${encodeURIComponent(row.id)}`}
                        className="mt-1.5 inline-flex text-xs font-medium text-sky-900 underline-offset-2 hover:underline"
                      >
                        詳細を見る
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <SupportInquiryResolveButton inquiryId={row.id} currentStatus={row.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-500">最大200件まで表示します（新しい順）。</p>
    </div>
  );
}

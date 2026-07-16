import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AdminDonguriGrantForm } from "@/components/admin/AdminDonguriGrantForm";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  listDonguriLedgerEntries,
  sumDonguriBalance,
  sumDonguriBalanceForEmail,
} from "@/lib/loghouse/donguriLedger";
import { countUnreadMailboxNotices } from "@/lib/loghouse/mailboxNotices";

type Props = {
  params: Promise<{ email: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { email } = await params;
  return { title: `どんぐり台帳｜${decodeURIComponent(email)}` };
}

export default async function AdminDonguriLedgerPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const { email: raw } = await params;
  const email = normalizeEmail(decodeURIComponent(raw));
  if (!email) notFound();

  const profiles = await prisma.profile.findMany({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });

  const accountBalance = await sumDonguriBalanceForEmail(email);
  const entries = await listDonguriLedgerEntries({ email, take: 100 });

  const perProfile = await Promise.all(
    profiles.map(async (p) => ({
      ...p,
      balance: await sumDonguriBalance({ email, profileId: p.id }),
      unread: await countUnreadMailboxNotices({ email, profileId: p.id }),
    })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
          ← 管理者ページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">どんぐり台帳</h1>
        <p className="mt-1 break-all text-sm text-stone-600">{email}</p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">現在残高（全プロフィール合算）</h2>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{accountBalance}</p>
        <ul className="mt-3 space-y-1 text-sm text-stone-700">
          {perProfile.map((p) => (
            <li key={p.id}>
              {p.nickname || p.id}：{p.balance}（未読ポスト {p.unread}）
            </li>
          ))}
        </ul>
      </section>

      <AdminDonguriGrantForm email={email} profiles={profiles} />

      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900">
          履歴
        </h2>
        {entries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-stone-600">まだ台帳がありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-3 py-2 font-medium">日時</th>
                  <th className="px-3 py-2 font-medium">amount</th>
                  <th className="px-3 py-2 font-medium">reason</th>
                  <th className="px-3 py-2 font-medium">title</th>
                  <th className="px-3 py-2 font-medium">description</th>
                  <th className="px-3 py-2 font-medium">dateKey</th>
                  <th className="px-3 py-2 font-medium">relatedNoticeId</th>
                  <th className="px-3 py-2 font-medium">createdBy</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id} className="border-t border-stone-100">
                    <td className="whitespace-nowrap px-3 py-2">
                      {new Date(row.createdAt).toLocaleString("ja-JP", {
                        timeZone: "Asia/Tokyo",
                      })}
                    </td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{row.delta}</td>
                    <td className="px-3 py-2">{row.reason}</td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2">{row.description ?? "—"}</td>
                    <td className="px-3 py-2">{row.dateKey ?? "—"}</td>
                    <td className="max-w-[8rem] truncate px-3 py-2">{row.relatedNoticeId ?? "—"}</td>
                    <td className="px-3 py-2">{row.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

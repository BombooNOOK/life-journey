import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type UserRow = {
  email: string;
  sourceOrderCount: number;
  sourceJournalCount: number;
  isAdmin: boolean;
  profileLimit: number;
  /** 鑑定PDFの無料ダウンロード上限（鑑定1件あたり） */
  pdfDownloadLimitPerOrder: number;
};

function clampPdfDownloadLimitPerOrder(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 2;
  return Math.min(999, Math.max(0, Math.trunc(n)));
}

async function loadRows(keyword: string): Promise<UserRow[]> {
  const where = keyword
    ? {
        email: {
          contains: keyword,
          mode: "insensitive" as const,
        },
      }
    : {};
  const [orderUsers, journalUsers, settings] = await Promise.all([
    prisma.order.findMany({
      where,
      distinct: ["email"],
      select: { email: true },
      take: 200,
    }),
    prisma.journalEntry.findMany({
      where,
      distinct: ["email"],
      select: { email: true },
      take: 200,
    }),
    prisma.accountSettings.findMany({
      where,
      select: {
        id: true,
        email: true,
        isAdmin: true,
        profileLimit: true,
        pdfDownloadLimitPerOrder: true,
        updatedAt: true,
      },
      take: 200,
    }),
  ]);
  const orderCountByEmail = new Map<string, number>();
  const journalCountByEmail = new Map<string, number>();
  const settingsByEmail = new Map<
    string,
    {
      id: string;
      email: string;
      isAdmin: boolean;
      profileLimit: number;
      pdfDownloadLimitPerOrder: number;
      updatedAt: Date;
    }
  >();
  for (const s of settings) {
    const key = normalizeEmail(s.email);
    const prev = settingsByEmail.get(key);
    if (!prev || prev.updatedAt < s.updatedAt) {
      settingsByEmail.set(key, s);
    }
  }

  for (const row of orderUsers) {
    const key = normalizeEmail(row.email);
    orderCountByEmail.set(key, (orderCountByEmail.get(key) ?? 0) + 1);
  }
  for (const row of journalUsers) {
    const key = normalizeEmail(row.email);
    journalCountByEmail.set(key, (journalCountByEmail.get(key) ?? 0) + 1);
  }
  const emails = new Set<string>([
    ...orderCountByEmail.keys(),
    ...journalCountByEmail.keys(),
    ...settingsByEmail.keys(),
  ]);
  return Array.from(emails)
    .map((email) => {
      const setting = settingsByEmail.get(email);
      return {
        email,
        sourceOrderCount: orderCountByEmail.get(email) ?? 0,
        sourceJournalCount: journalCountByEmail.get(email) ?? 0,
        isAdmin: setting?.isAdmin ?? false,
        profileLimit: setting?.profileLimit ?? 1,
        pdfDownloadLimitPerOrder: setting?.pdfDownloadLimitPerOrder ?? 2,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, 200);
}

export default async function AdminPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) notFound();

  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const rows = await loadRows(q);

  async function updateProfileLimit(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email")?.toString());
    if (!email) return;
    const viewer = await getViewerEmailFromCookie();
    if (!(await isAdminEmail(viewer))) notFound();
    const profileLimitRaw = formData.get("profileLimit")?.toString();
    const profileLimit = profileLimitRaw === "3" ? 3 : 1;

    const merged = await prisma.accountSettings.upsert({
      where: { email },
      create: { email, profileLimit, isAdmin: false, pdfDownloadLimitPerOrder: 2 },
      update: { profileLimit },
    });
    // Case-insensitive duplicates can exist in older rows.
    // Keep all variants in sync so the admin list doesn't bounce back.
    const duplicates = await prisma.accountSettings.findMany({
      select: { id: true, email: true },
      where: { NOT: { id: merged.id } },
    });
    const targetIds = duplicates
      .filter((d) => normalizeEmail(d.email) === email)
      .map((d) => d.id);
    if (targetIds.length > 0) {
      await prisma.accountSettings.updateMany({
        where: { id: { in: targetIds } },
        data: { profileLimit },
      });
    }
    revalidatePath("/admin");
  }

  async function toggleAdminRole(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email")?.toString());
    if (!email) return;
    const viewer = await getViewerEmailFromCookie();
    if (!(await isAdminEmail(viewer))) notFound();
    const isAdminRaw = formData.get("isAdmin")?.toString();
    const isAdmin = isAdminRaw === "1";
    const merged = await prisma.accountSettings.upsert({
      where: { email },
      create: { email, profileLimit: 1, isAdmin, pdfDownloadLimitPerOrder: 2 },
      update: { isAdmin },
    });
    const duplicates = await prisma.accountSettings.findMany({
      select: { id: true, email: true },
      where: { NOT: { id: merged.id } },
    });
    const targetIds = duplicates
      .filter((d) => normalizeEmail(d.email) === email)
      .map((d) => d.id);
    if (targetIds.length > 0) {
      await prisma.accountSettings.updateMany({
        where: { id: { in: targetIds } },
        data: { isAdmin },
      });
    }
    revalidatePath("/admin");
  }

  async function updatePdfDownloadLimitPerOrder(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email")?.toString());
    if (!email) return;
    const viewer = await getViewerEmailFromCookie();
    if (!(await isAdminEmail(viewer))) notFound();
    const pdfDownloadLimitPerOrder = clampPdfDownloadLimitPerOrder(
      formData.get("pdfDownloadLimitPerOrder")?.toString(),
    );

    const merged = await prisma.accountSettings.upsert({
      where: { email },
      create: { email, profileLimit: 1, isAdmin: false, pdfDownloadLimitPerOrder },
      update: { pdfDownloadLimitPerOrder },
    });
    const duplicates = await prisma.accountSettings.findMany({
      select: { id: true, email: true },
      where: { NOT: { id: merged.id } },
    });
    const targetIds = duplicates
      .filter((d) => normalizeEmail(d.email) === email)
      .map((d) => d.id);
    if (targetIds.length > 0) {
      await prisma.accountSettings.updateMany({
        where: { id: { in: targetIds } },
        data: { pdfDownloadLimitPerOrder },
      });
    }
    await prisma.order.updateMany({
      where: { email },
      data: { pdfDownloadLimit: pdfDownloadLimitPerOrder },
    });
    revalidatePath("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">管理者ページ</h1>
        <p className="mt-1 text-sm text-stone-600">
          ユーザー検索と、プロフィール上限（1 / 3）、鑑定書PDFの無料ダウンロード上限、管理者権限の切り替えを行います。
        </p>
      </div>

      <form action="/admin" className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="メールで検索"
          className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          検索
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">鑑定</th>
              <th className="px-4 py-3 font-medium">日記</th>
              <th className="px-4 py-3 font-medium">プロフィール上限</th>
              <th className="px-4 py-3 font-medium">PDF無料回数</th>
              <th className="px-4 py-3 font-medium">管理者</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.email} className="border-t border-stone-100">
                <td className="px-4 py-3 text-stone-800">{row.email}</td>
                <td className="px-4 py-3 text-stone-600">{row.sourceOrderCount}</td>
                <td className="px-4 py-3 text-stone-600">{row.sourceJournalCount}</td>
                <td className="px-4 py-3">
                  <form action={updateProfileLimit} className="flex items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <select
                      name="profileLimit"
                      defaultValue={String(row.profileLimit)}
                      className="rounded-md border border-stone-300 px-2 py-1"
                    >
                      <option value="1">1</option>
                      <option value="3">3</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      上限更新
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={updatePdfDownloadLimitPerOrder} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <input
                      type="number"
                      name="pdfDownloadLimitPerOrder"
                      min={0}
                      max={999}
                      defaultValue={String(row.pdfDownloadLimitPerOrder)}
                      className="w-20 rounded-md border border-stone-300 px-2 py-1"
                      title="鑑定1件あたりの無料PDFダウンロード回数（閲覧・DL共通）"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      更新
                    </button>
                  </form>
                  <p className="mt-1 text-[10px] leading-tight text-stone-400">
                    保存するとこのメールの既存鑑定にも上限を反映します
                  </p>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleAdminRole} className="flex items-center gap-2">
                    <input type="hidden" name="email" value={row.email} />
                    <input type="hidden" name="isAdmin" value={row.isAdmin ? "0" : "1"} />
                    <span className={row.isAdmin ? "text-emerald-700" : "text-stone-500"}>
                      {row.isAdmin ? "ON" : "OFF"}
                    </span>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50"
                    >
                      切替
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-stone-500">保存は即時反映</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        最初の管理者は、環境変数 <code>ADMIN_EMAILS</code>（カンマ区切り）で指定すると安全です。
      </div>
    </div>
  );
}

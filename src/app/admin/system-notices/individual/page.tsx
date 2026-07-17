import Link from "next/link";
import { notFound } from "next/navigation";

import { sendIndividualSystemNoticeAction } from "@/app/admin/system-notices/actions";
import { isAdminEmail } from "@/lib/admin/access";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { SYSTEM_NOTICE_SENDER_NAME } from "@/lib/loghouse/systemNoticeTypes";
import { listActiveProfilesForEmail } from "@/lib/loghouse/systemNotices";

type Props = {
  searchParams: Promise<{
    email?: string;
    err?: string;
    saved?: string;
    noticeId?: string;
  }>;
};

export default async function AdminSystemNoticeIndividualPage({ searchParams }: Props) {
  const viewer = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewer))) notFound();

  const params = await searchParams;
  const emailQuery = normalizeEmail(params.email ?? "");
  const profiles = emailQuery ? await listActiveProfilesForEmail(emailQuery) : [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link
          href="/admin/system-notices"
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← {SYSTEM_NOTICE_SENDER_NAME}一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">個別送信</h1>
        <p className="mt-1 text-sm text-stone-600">
          指定したメール／プロフィールのポストにだけ届きます。全ユーザーには送られません。
        </p>
      </div>

      {params.err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {params.err}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          個別送信しました。
          {params.noticeId ? (
            <span className="mt-1 block font-mono text-xs text-emerald-900/80">
              noticeId: {params.noticeId}
            </span>
          ) : null}
        </div>
      ) : null}

      <form
        action="/admin/system-notices/individual"
        method="get"
        className="space-y-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium text-stone-800">宛先メール</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={emailQuery}
            placeholder="user@example.com"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          プロフィールを表示
        </button>
      </form>

      {emailQuery && profiles.length === 0 ? (
        <p className="text-sm text-amber-900">
          このメールに有効なプロフィールがありません。メールアドレスを確認してください。
        </p>
      ) : null}

      {emailQuery && profiles.length > 0 ? (
        <form
          action={sendIndividualSystemNoticeAction}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"
        >
          <input type="hidden" name="email" value={emailQuery} />

          <p className="text-sm text-stone-700">
            宛先: <span className="font-medium text-stone-900">{emailQuery}</span>
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-800">プロフィール</span>
            <select
              name="profileId"
              required
              defaultValue={profiles[0]?.id}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || "（名前なし）"} — {p.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-800">タイトル</span>
            <input
              name="title"
              required
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              placeholder="例: テスト配信のお知らせ"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-800">本文</span>
            <textarea
              name="body"
              required
              rows={8}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm leading-relaxed"
              placeholder="この宛先だけに届く本文"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-800">
                アクション文言（任意）
              </span>
              <input
                name="actionLabel"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-800">
                アクション経路（任意）
              </span>
              <input
                name="actionRoute"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                placeholder="/help"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <input type="checkbox" name="confirmed" value="1" required />
            この宛先だけに送ることを確認しました（全ユーザーには送られません）
          </label>

          <button
            type="submit"
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            個別送信する
          </button>
        </form>
      ) : null}
    </div>
  );
}

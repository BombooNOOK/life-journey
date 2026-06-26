import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ROUTES = [
  { href: "/admin/post-atelier", label: "投稿アトリエ トップ" },
  {
    href: "/admin/post-atelier/daily-number/new",
    label: "今日のこころ予報を作成（新機能）",
    highlight: true,
  },
  {
    href: "/preview/post-atelier/daily-number-layout",
    label: "画像レイアウト定規（dev）",
    highlight: true,
  },
  { href: "/admin/post-atelier/new", label: "汎用・新規投稿案" },
  { href: "/admin/post-atelier/posts", label: "投稿一覧（絞り込み）" },
  { href: "/admin/post-atelier/calendar", label: "予定カレンダー" },
] as const;

const CHECKLIST = [
  "DB 接続 OK（SocialPostDraft + daily_number カラム）",
  "/admin/post-atelier/daily-number/new にアクセスできる",
  "予定日 2026-06-19 → 今日のすうじ 8・表紙・個別6ページプレビュー",
  "予定日 2026-06-24 → 「データ準備中」表示（クラッシュしない）",
  "Canva貼り付け用 / Instagramキャプションをコピーできる",
  "生成して保存 → daily-number/[id] で再表示できる",
  "編集画面で Instagram用画像プレビュー・ZIPダウンロード（8枚）",
  "汎用 /admin/post-atelier/new が従来どおり動く",
  "非 admin で notFound（404）になる",
] as const;

async function loadPreviewStats(): Promise<{ draftCount: number; migrationOk: boolean }> {
  try {
    const draftCount = await prisma.socialPostDraft.count();
    return { draftCount, migrationOk: true };
  } catch {
    return { draftCount: 0, migrationOk: false };
  }
}

export default async function PostAtelierPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const stats = await loadPreviewStats();
  const loginReturnTo = encodeURIComponent("/admin/post-atelier");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Dev preview</p>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">BambooNOOK 投稿アトリエ（確認用）</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Cursor の Simple Browser 用ハブです。管理者ページ本体はログインと{" "}
          <code className="rounded bg-stone-200 px-1">ADMIN_EMAILS</code>（または DB の isAdmin）が必要です。
        </p>

        <div
          className={[
            "mt-6 rounded-xl border px-4 py-3 text-sm",
            stats.migrationOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          <p className="font-medium">
            DB: {stats.migrationOk ? "SocialPostDraft 接続 OK" : "SocialPostDraft に接続できません"}
          </p>
          {stats.migrationOk ? (
            <p className="mt-1 text-xs opacity-90">保存済み投稿案: {stats.draftCount} 件</p>
          ) : (
            <p className="mt-1 text-xs">
              <code className="rounded bg-white/70 px-1">npm run db:local:sync</code> を実行してください。
            </p>
          )}
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-stone-800">1. 管理者ログイン（未ログインの場合）</h2>
          <Link
            href={`/login?returnTo=${loginReturnTo}`}
            className="mt-3 inline-flex rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
          >
            ログインして投稿アトリエへ →
          </Link>
        </section>

        <section className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="font-medium">画像レイアウト定規（dev）</p>
          <p className="mt-2 text-xs leading-relaxed">
            819×1024 を 1:1 表示。10/50px グリッド・クリック座標・5px 基準マス・配置アンカー表示。
          </p>
          <Link
            href="/preview/post-atelier/daily-number-layout"
            className="mt-3 inline-flex rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
          >
            レイアウト定規を開く →
          </Link>
        </section>

        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-medium">こころ予報の確認用予定日</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
            <li>
              <strong>2026-06-19</strong> … 今日のすうじ 8（プレビュー・保存 OK）
            </li>
            <li>
              <strong>2026-06-24</strong> … 今日のすうじ 4（準備中表示の確認）
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-stone-800">2. 投稿アトリエ各画面</h2>
          <ul className="mt-3 space-y-2">
            {ROUTES.map(({ href, label, highlight }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "block rounded-lg border px-4 py-3 shadow-sm transition",
                    highlight
                      ? "border-emerald-300 bg-emerald-50/80 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100/80"
                      : "border-stone-200 bg-white text-stone-800 hover:border-violet-200 hover:bg-violet-50/40",
                  ].join(" ")}
                >
                  <span className="font-medium">{label}</span>
                  <span className="mt-1 block font-mono text-xs text-stone-500">{href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-stone-800">3. 確認チェックリスト</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
            {CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
          <p className="font-medium">非 admin の 404 確認</p>
          <p className="mt-2">
            別アカウントでログインするか、一時的に{" "}
            <code className="rounded bg-white/70 px-1">ADMIN_EMAILS</code> から自分のメールを外して dev
            サーバーを再起動し、上のリンクを開いてください。
          </p>
        </section>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/preview" className="text-stone-600 underline hover:text-stone-900">
            ← 校正メニューへ
          </Link>
          <Link href="/admin" className="text-stone-600 underline hover:text-stone-900">
            管理者ページへ
          </Link>
        </p>
      </div>
    </div>
  );
}

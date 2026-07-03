import type { Metadata } from "next";
import Link from "next/link";

import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import { LinkToOperationGuide } from "@/components/guide/GuideCrossLinks";
import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { LOG_HOUSE_BACK_LINK, LOG_HOUSE_TAGLINE } from "@/lib/journal/logHouseLabels";
import { APP_DISPLAY_NAME } from "@/lib/branding/appDisplayName";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "初めての3分ガイド",
};

function StepLink({ href, label }: { href: string; label: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex min-h-[44px] items-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-50/80"
    >
      {label} →
    </Link>
  );
}

export default function GuideFirstPage() {
  return (
    <div className="home-read-scope space-y-6">
      <PageTitleWithAccent
        tone="guide"
        title="初めての3分ガイド"
        backLink={LOG_HOUSE_BACK_LINK}
        description={
          <>
            <p>{LOG_HOUSE_TAGLINE}</p>
            <p className="mt-2">
              {APP_DISPLAY_NAME} をはじめるにあたり、これだけ知っておけば大丈夫です。くわしくは
              <Link href="/help/ljd" className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline">
                LJDの歩き方
              </Link>
              へ。
            </p>
          </>
        }
        cornerAccents={["leaf", "book"]}
      />

      <ol className="space-y-4">
        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">STEP 1</p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">無料鑑定を受ける</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            日記の読み解きコメントは、鑑定書を土台にしています。まず無料鑑定を受け取り、本棚で結果を読み返してみましょう。
          </p>
          <StepLink href="/order" label="無料鑑定をはじめる" />
        </li>

        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">STEP 2</p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">最初の1ページを残す</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            今日の気分から、どうぶつ鑑定士といっしょに短く書き始められます。長文でなくて大丈夫です。
          </p>
          <StepLink
            href="/journal/with-companion?returnTo=%2Forders"
            label={<CompanionWritingButtonLabel />}
          />
          <p className="mt-2 text-xs text-stone-500">
            いつもどおり書きたい方は
            <Link href="/orders/calendar" className="mx-1 text-emerald-900 underline-offset-2 hover:underline">
              カレンダーから日記を書く
            </Link>
            でも始められます。
          </p>
        </li>

        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">STEP 3</p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">カレンダーで読み返す</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            書いた日はカレンダーに印が付きます。保存後に届く読み解きコメントも、プレビューで読み返せます。
          </p>
          <StepLink href="/orders/calendar" label="カレンダーを開く" />
        </li>

        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">STEP 4</p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">困ったら LJDの歩き方へ</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            ログハウスと本棚の違い、日記ブック、製本の流れなどは、目次から必要な項目だけ読めます。
          </p>
          <StepLink href="/help/ljd" label="LJDの歩き方（目次）" />
        </li>
      </ol>

      <LinkToOperationGuide />
    </div>
  );
}

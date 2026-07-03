import type { Metadata } from "next";
import Link from "next/link";

import { GuestReadingFontSizeBand } from "@/components/reading/GuestReadingFontSizeBand";
import { LinkToDiaryGuide } from "@/components/guide/GuideCrossLinks";
import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { SoftIllustrationAccent } from "@/components/ui/SoftIllustrationAccent";
import { APP_DISPLAY_NAME } from "@/lib/branding/appDisplayName";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Life Journey Diaryの使い方",
};

function StepCard({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4 pr-12 shadow-sm">
      <span
        className="pointer-events-none absolute right-3 top-3 flex h-7 w-7 select-none items-center justify-center rounded-full border border-emerald-100 bg-emerald-50/90 text-xs font-semibold text-emerald-800/70"
        aria-hidden="true"
      >
        {step}
      </span>
      <div className="pointer-events-none absolute bottom-3 right-10 hidden select-none sm:block">
        <SoftIllustrationAccent variant="leaf" size="sm" tone="stone" />
      </div>
      <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">{children}</div>
    </article>
  );
}

function GuideAppLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="mt-3">
      <Link
        href={href}
        className="font-medium text-emerald-900 underline-offset-2 hover:underline"
      >
        {label} →
      </Link>
    </p>
  );
}

export default function GuidePage() {
  return (
    <div className="home-read-scope space-y-6">
      <div id="guide-top" className="scroll-mt-24">
        <PageTitleWithAccent
          tone="guide"
          title="Life Journey Diaryの使い方"
          backLink={LOG_HOUSE_BACK_LINK}
          description={`${APP_DISPLAY_NAME} で、無料鑑定から日記・製本までの流れをまとめました。実際の画面操作に沿った内容です。`}
          cornerAccents={["book", "leaf"]}
        />
      </div>

      <ol className="space-y-3">
        <li>
          <StepCard step="1" title="1. まずは無料鑑定から">
            <p>
              生年月日などを入力して、コアナンバーの鑑定結果を受け取ります。結果はログハウスに保存され、あとから本棚で読み返せます。
            </p>
            <p className="text-xs text-stone-500">
              ヘッダーの「はじめての方」からも同じ画面を開けます（無料鑑定フォームです）。
            </p>
            <GuideAppLink href="/order" label="無料鑑定をはじめる" />
          </StepCard>
        </li>

        <li>
          <StepCard step="2" title="2. 鑑定書を本棚で読む">
            <p>
              保存した鑑定は「本棚」に並びます。カードを開いて本文を読んだり、鑑定書PDFを端末に保存したりできます（PDFの保存手順は別ページにあります）。
            </p>
            <GuideAppLink href="/orders/bookshelf" label="本棚を開く" />
            <p className="mt-2 text-xs text-stone-500">
              PDFの保存方法は
              <Link href="/help/pdf-download" className="mx-0.5 text-emerald-900 hover:underline">
                鑑定書PDFのダウンロード方法
              </Link>
              をご覧ください（ログイン後に本棚から開く操作です）。
            </p>
          </StepCard>
        </li>

        <li>
          <StepCard step="3" title="3. 今日の日記を書く">
            <p>
              ログハウスやカレンダーから「今日の日記を書く」を選び、その日の気持ちや出来事を短く残せます。活動の種類（仕事・休息など）を選び、本文を書いて保存します。
            </p>
            <GuideAppLink href="/journal" label="今日の日記を書く" />
          </StepCard>
        </li>

        <li>
          <StepCard step="4" title="4. 1日1枚、写真を添える">
            <p>
              記録フォームから、1日につき1枚まで写真を添付できます。製本イメージのプレビューでも、写真の見え方を確認できます。
            </p>
            <GuideAppLink href="/journal" label="日記画面で写真を添える" />
          </StepCard>
        </li>

        <li>
          <StepCard step="5" title="5. フクロウ先生の言葉を受け取る">
            <p>
              日記を保存すると、フクロウ先生の読み解き（数字に沿ったことば）が届きます。記録画面やプレビューで、いつでも読み返せます。
            </p>
            <GuideAppLink href="/journal" label="日記を保存して読み解きを見る" />
          </StepCard>
        </li>

        <li>
          <StepCard step="6" title="6. カレンダーや月別一覧で振り返る">
            <p>
              ログハウスの Life Journey Diary カードでは、月ごとのカレンダーで記録のある日を確認できます。本棚の日記（年ごとの本）では、月別一覧から各日のプレビューを開けます。
            </p>
            <GuideAppLink href="/orders" label="ログハウスのカレンダーを見る" />
            <GuideAppLink href="/orders/bookshelf" label="本棚から日記の年を開く" />
          </StepCard>
        </li>

        <li>
          <StepCard step="7" title="7. 製本前プレビューを確認する">
            <p>
              日記を製本する前に、本棚からその年の日記を開き、「製本前確認」でページの並び・長文の注意・本に入れる記事の選択を確認してください。問題なければ製本申込コードを発行し、BASEで注文します。
            </p>
            <GuideAppLink href="/orders/bookshelf" label="本棚から製本前確認へ" />
            <p className="mt-2 text-xs leading-5 text-stone-500">
              長い本文がある日は、一覧に「長文注意」が表示されます。該当日のプレビューで表示を確認してから申し込むことをおすすめします。
            </p>
          </StepCard>
        </li>
      </ol>

      <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50/80 p-4 text-sm text-stone-700 shadow-sm">
        <div className="pointer-events-none absolute right-3 top-3 hidden select-none sm:block">
          <SoftIllustrationAccent variant="book" size="sm" tone="emerald" />
        </div>
        <p className="relative z-10 font-medium text-stone-900">はじめての流れ（まとめ）</p>
        <p className="relative z-10 mt-2 leading-6">
          無料鑑定 → 本棚で鑑定書を読む → 日記を書く → 振り返り → 製本前確認、の順が基本です。迷ったらログハウスから各機能へ進めます。
        </p>
        <div className="relative z-10">
          <GuideAppLink href="/order" label="いま無料鑑定からはじめる" />
        </div>
      </div>

      <LinkToDiaryGuide />

      <GuestReadingFontSizeBand pageKey="guide" />
    </div>
  );
}

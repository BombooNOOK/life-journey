"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";

import { GuideAppLink } from "@/components/help/GuideAppLink";
import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import {
  FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF,
  FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL,
  FOREST_GUIDE_STATION_TITLE,
} from "@/lib/help/forestGuideStation";
import { LOG_HOUSE_OPEN_LABEL, LOG_HOUSE_SHORT_LABEL } from "@/lib/journal/logHouseLabels";

type TocItem = {
  id: string;
  title: string;
  summary: string;
  body: React.ReactNode;
};

const TOC_ITEMS: TocItem[] = [
  {
    id: "about",
    title: "LJD とは",
    summary: "Life Journey Diary の考え方",
    body: (
      <>
        <p>
          Life Journey Diary（LJD）は、鑑定書と日記がつながる場所です。数字で紡ぐ人生の旅を、日々の言葉で重ねていきます。
        </p>
        <p className="mt-2">
          特別なことがあった日だけでなく、いつも通りの日も、少し疲れた日も、なんとなく心が動いた日も——今日という一日を、あなた自身の言葉で残していく日記です。
        </p>
        <p className="mt-3">
          <Link href="/diary-guide" className="font-medium text-emerald-900 underline-offset-2 hover:underline">
            くわしい歩き方（文章版）→
          </Link>
        </p>
      </>
    ),
  },
  {
    id: "loghouse",
    title: "ログハウスと本棚",
    summary: "拠点と、本の保管場所",
    body: (
      <>
        <p>
          <strong>{LOG_HOUSE_SHORT_LABEL}</strong>は、LJD の拠点です。プロフィールの選択、日記を書く・読む、本棚への入口があります。
        </p>
        <p className="mt-2">
          <strong>本棚</strong>は、プロフィールごとに、鑑定結果や日記ブックを保管・読み返す場所です。
        </p>
        <GuideAppLink href="/orders" label={LOG_HOUSE_OPEN_LABEL} />
        <GuideAppLink href="/orders/bookshelf" label="本棚を開く" />
      </>
    ),
  },
  {
    id: "kantei",
    title: "無料鑑定",
    summary: "日記の読み解きの土台",
    body: (
      <>
        <p>
          無料鑑定でコアナンバーの鑑定書を受け取ります。日記を保存したあとに届く「読み解きコメント」は、この鑑定を土台にしています。
        </p>
        <p className="mt-2 text-sm text-stone-600">
          数秘術のくわしい説明は
          <Link
            href={FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF}
            className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            {FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL}
          </Link>
          をご覧ください。まずは鑑定を受けて、本棚で結果を読み返してみてください。
        </p>
        <GuideAppLink href="/order" label="無料鑑定をはじめる" />
      </>
    ),
  },
  {
    id: "writing",
    title: "日記の書き方",
    summary: "気分・本文・写真",
    body: (
      <>
        <p>カレンダーから日付を選び、今日の気持ちや出来事を短く残します。1日1枚まで写真を添えられます。</p>
        <GuideAppLink href="/orders/calendar" label="カレンダーから日記を書く" />
      </>
    ),
  },
  {
    id: "companion-writing",
    title: "どうぶつ鑑定士といっしょに書く",
    summary: "気分から、鑑定士と短く書き始める",
    body: (
      <>
        <p>
          今日の気分を選ぶと、どうぶつ鑑定士のことばが届きます。そのあと、短い一問に答えながら、最初の1ページを残せます。
        </p>
        <p className="mt-2 text-sm text-stone-600">
          はじめて日記を書く方におすすめの入口です。
        </p>
        <GuideAppLink
          href="/journal/with-companion?returnTo=%2Forders"
          label={<CompanionWritingButtonLabel />}
        />
      </>
    ),
  },
  {
    id: "reading",
    title: "読み解きコメント",
    summary: "保存後に届く、鑑定士のことば",
    body: (
      <>
        <p>
          日記を保存すると、どうぶつ鑑定士による読み解きコメントが届きます。プレビュー画面でいつでも読み返せます。保存前の入力中には表示されません。
        </p>
        <GuideAppLink href="/orders/calendar" label="日記を書いて読み解きを見る" />
      </>
    ),
  },
  {
    id: "calendar",
    title: "カレンダー・一覧",
    summary: "記録した日を振り返る",
    body: (
      <>
        <p>カレンダーで月ごとに記録のある日を確認できます。月別一覧からも、書いた日記を読み返せます。</p>
        <GuideAppLink href="/orders/calendar" label="カレンダーを開く" />
        <GuideAppLink href="/orders/list" label="月別一覧を開く" />
      </>
    ),
  },
  {
    id: "bookshelf",
    title: "本棚・日記ブック",
    summary: "鑑定書と日記ブック",
    body: (
      <>
        <p>本棚には鑑定書や、期間を選んで作った日記ブックが並びます。製本をご希望の方は、本棚から製本前確認へ進めます。</p>
        <GuideAppLink href="/orders/bookshelf" label="本棚を開く" />
        <p className="mt-2 text-xs text-stone-500">
          操作のくわしい流れは
          <Link href="/guide" className="mx-0.5 text-emerald-900 hover:underline">
            使い方
          </Link>
          もご覧ください。
        </p>
      </>
    ),
  },
  {
    id: "numerology-reading",
    title: "LJDで使っているすうじの読み方",
    summary: "数字のテーマとナンバーの意味",
    body: (
      <>
        <p>
          日記を見返すための数字テーマや、鑑定書で使うナンバーについて、くわしく説明しています。迷ったときや、詳しく知りたいときにご覧ください。
        </p>
        <GuideAppLink href="/help/ljd/numerology-reading" label="くわしく読む" />
      </>
    ),
  },
  {
    id: "help",
    title: "困ったとき",
    summary: "その他のヘルプ",
    body: (
      <>
        <ul className="list-inside list-disc space-y-1 text-stone-700">
          <li>
            <Link href="/guide/first/welcome" className="text-emerald-900 underline-offset-2 hover:underline">
              はじめての方へ
            </Link>
          </li>
          <li>
            <Link href="/guide" className="text-emerald-900 underline-offset-2 hover:underline">
              使い方（操作手順）
            </Link>
          </li>
          <li>
            <Link href="/help/home-screen" className="text-emerald-900 underline-offset-2 hover:underline">
              ホーム画面に追加する
            </Link>
          </li>
          <li>
            <Link href="/help/pdf-download" className="text-emerald-900 underline-offset-2 hover:underline">
              鑑定書PDFのダウンロード
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-emerald-900 underline-offset-2 hover:underline">
              お問い合わせ
            </Link>
          </li>
        </ul>
      </>
    ),
  },
];


export function LjdWalkthroughToc() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <nav className="space-y-2" aria-label={`${FOREST_GUIDE_STATION_TITLE} 目次`}>
      <ol className="space-y-2">
        {TOC_ITEMS.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id} id={item.id} className="scroll-mt-24">
              <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <button
                  type="button"
                  id={`${item.id}-heading`}
                  aria-expanded={isOpen}
                  aria-controls={`${item.id}-panel`}
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-stone-50/80"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-stone-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{item.summary}</span>
                  </span>
                  <span className="shrink-0 text-stone-400" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <div
                    id={`${item.id}-panel`}
                    role="region"
                    aria-labelledby={`${item.id}-heading`}
                    className="border-t border-stone-100 px-4 py-3 text-sm leading-6 text-stone-700"
                  >
                    {item.body}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { GuideAppLink } from "@/components/help/GuideAppLink";
import { LjdDiaryBookGuideCoverPreview } from "@/components/help/LjdDiaryBookGuideCoverPreview";
import { LjdDiaryWritingGuideBody } from "@/components/help/LjdDiaryWritingGuideBody";
import { LjdAboutLpEmbed } from "@/components/help/LjdAboutLpEmbed";
import { LjdLogHouseGuideShot } from "@/components/help/LjdLogHouseGuideShot";
import { HomeAppraiserProfilesSection } from "@/components/home/HomeAppraiserProfilesSection";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import {
  LJD_BOOKSHELF_GUIDE_BINDING_BODY,
  LJD_BOOKSHELF_GUIDE_BINDING_NOTE,
  LJD_BOOKSHELF_GUIDE_BINDING_TITLE,
  LJD_BOOKSHELF_GUIDE_CROSSREF,
  LJD_BOOKSHELF_GUIDE_LEAD,
  LJD_BOOKSHELF_GUIDE_SECTION_SUMMARY,
  LJD_BOOKSHELF_GUIDE_SECTION_TITLE,
  LJD_BOOKSHELF_GUIDE_VIEW_BODY,
  LJD_BOOKSHELF_GUIDE_VIEW_TITLE,
} from "@/lib/help/ljdBookshelfGuideCopy";
import {
  LJD_CALENDAR_LIST_GUIDE_CALENDAR_BODY,
  LJD_CALENDAR_LIST_GUIDE_CALENDAR_TITLE,
  LJD_CALENDAR_LIST_GUIDE_LEAD,
  LJD_CALENDAR_LIST_GUIDE_LIST_BODY,
  LJD_CALENDAR_LIST_GUIDE_LIST_BULLETS,
  LJD_CALENDAR_LIST_GUIDE_LIST_TITLE,
  LJD_CALENDAR_LIST_GUIDE_SECTION_SUMMARY,
  LJD_CALENDAR_LIST_GUIDE_SECTION_TITLE,
  LJD_CALENDAR_LIST_GUIDE_TAG_NOTE,
} from "@/lib/help/ljdCalendarListGuideCopy";
import {
  LJD_DIARY_BOOK_GUIDE_LEAD,
  LJD_DIARY_BOOK_GUIDE_SECTION_SUMMARY,
  LJD_DIARY_BOOK_GUIDE_SECTION_TITLE,
  LJD_DIARY_BOOK_GUIDE_STEPS,
} from "@/lib/help/ljdDiaryBookGuideCopy";
import { LJD_DIARY_WRITING_GUIDE_SECTION_SUMMARY } from "@/lib/help/ljdDiaryWritingGuideCopy";
import {
  LJD_DONGURI_GUIDE_BODY_PARAGRAPHS,
  LJD_DONGURI_GUIDE_LINK_LABEL,
  LJD_DONGURI_GUIDE_SECTION_SUMMARY,
  LJD_DONGURI_GUIDE_SECTION_TITLE,
} from "@/lib/help/ljdDonguriGuideCopy";
import { LJD_LOG_HOUSE_GUIDE_SECTION_SUMMARY } from "@/lib/help/ljdLogHouseGuideAnnotate";
import {
  LJD_MAILBOX_GUIDE_BODY_PARAGRAPHS,
  LJD_MAILBOX_GUIDE_LINK_LABEL,
  LJD_MAILBOX_GUIDE_SECTION_SUMMARY,
  LJD_MAILBOX_GUIDE_SECTION_TITLE,
} from "@/lib/help/ljdMailboxGuideCopy";
import {
  FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF,
  FOREST_GUIDE_STATION_NUMEROLOGY_READING_LINK_LABEL,
  FOREST_GUIDE_STATION_TITLE,
} from "@/lib/help/forestGuideStation";
import { LOG_HOUSE_MAILBOX_PAGE_PATH } from "@/lib/loghouse/logHouseMailboxCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { LOG_HOUSE_SHORT_LABEL } from "@/lib/journal/logHouseLabels";

type TocItem = {
  id: string;
  title: string;
  summary: string;
  body: ReactNode;
};

const TOC_ITEMS: TocItem[] = [
  {
    id: "about",
    title: "LJD とは",
    summary: "Life Journey Diaryのことを、ゆっくりご紹介します",
    body: <LjdAboutLpEmbed />,
  },
  {
    id: "loghouse",
    title: LOG_HOUSE_SHORT_LABEL,
    summary: LJD_LOG_HOUSE_GUIDE_SECTION_SUMMARY,
    body: <LjdLogHouseGuideShot />,
  },
  {
    id: "mailbox",
    title: LJD_MAILBOX_GUIDE_SECTION_TITLE,
    summary: LJD_MAILBOX_GUIDE_SECTION_SUMMARY,
    body: (
      <>
        {LJD_MAILBOX_GUIDE_BODY_PARAGRAPHS.map((paragraph, index) => (
          <p key={paragraph} className={index === 0 ? undefined : "mt-2"}>
            {paragraph}
          </p>
        ))}
        <GuideAppLink
          href={LOG_HOUSE_MAILBOX_PAGE_PATH}
          label={LJD_MAILBOX_GUIDE_LINK_LABEL}
          feature="guide_loghouse"
        />
      </>
    ),
  },
  {
    id: "donguri",
    title: LJD_DONGURI_GUIDE_SECTION_TITLE,
    summary: LJD_DONGURI_GUIDE_SECTION_SUMMARY,
    body: (
      <>
        {LJD_DONGURI_GUIDE_BODY_PARAGRAPHS.map((paragraph, index) => (
          <p key={paragraph} className={index === 0 ? undefined : "mt-2"}>
            {paragraph}
          </p>
        ))}
        <GuideAppLink
          href="/orders"
          label={LJD_DONGURI_GUIDE_LINK_LABEL}
          feature="guide_loghouse"
        />
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
        <GuideAppLink href={FIRST_VISIT_ROUTES.pathGuide} label="無料鑑定をはじめる" />
      </>
    ),
  },
  {
    id: "writing",
    title: "日記の書き方",
    summary: LJD_DIARY_WRITING_GUIDE_SECTION_SUMMARY,
    body: <LjdDiaryWritingGuideBody variant="dictionary" />,
  },
  {
    id: "appraisers",
    title: "どうぶつ鑑定士の紹介",
    summary: "森の仲間たち",
    body: (
      <>
        <p>
          日記の読み解きや、いっしょに書くときに寄り添ってくれる、森のどうぶつ鑑定士たちです。性格や話し方にちがいがあるので、気になる子から眺めてみてください。
        </p>
        <div className="mt-4">
          <HomeAppraiserProfilesSection framed={false} showHeading={false} />
        </div>
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
        <GuideAppLink
          href="/orders/calendar"
          label="日記を書いて読み解きを見る"
          feature="guide_calendar"
        />
      </>
    ),
  },
  {
    id: "calendar",
    title: LJD_CALENDAR_LIST_GUIDE_SECTION_TITLE,
    summary: LJD_CALENDAR_LIST_GUIDE_SECTION_SUMMARY,
    body: (
      <>
        <p>{LJD_CALENDAR_LIST_GUIDE_LEAD}</p>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3">
            <p className="text-sm font-semibold text-stone-900">{LJD_CALENDAR_LIST_GUIDE_CALENDAR_TITLE}</p>
            <p className="mt-1.5 text-sm leading-6 text-stone-700">{LJD_CALENDAR_LIST_GUIDE_CALENDAR_BODY}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3">
            <p className="text-sm font-semibold text-stone-900">{LJD_CALENDAR_LIST_GUIDE_LIST_TITLE}</p>
            <p className="mt-1.5 text-sm leading-6 text-stone-700">{LJD_CALENDAR_LIST_GUIDE_LIST_BODY}</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-stone-700">
              {LJD_CALENDAR_LIST_GUIDE_LIST_BULLETS.map((item) => (
                <li key={item}>・{item}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{LJD_CALENDAR_LIST_GUIDE_TAG_NOTE}</p>
          </div>
        </div>
        <GuideAppLink href="/orders/calendar" label="カレンダーを開く" feature="guide_calendar" />
        <GuideAppLink href="/orders/list" label="日記一覧を開く" feature="guide_list" />
      </>
    ),
  },
  {
    id: "bookshelf",
    title: LJD_BOOKSHELF_GUIDE_SECTION_TITLE,
    summary: LJD_BOOKSHELF_GUIDE_SECTION_SUMMARY,
    body: (
      <>
        <p>{LJD_BOOKSHELF_GUIDE_LEAD}</p>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3">
            <p className="text-sm font-semibold text-stone-900">{LJD_BOOKSHELF_GUIDE_VIEW_TITLE}</p>
            <p className="mt-1.5 text-sm leading-6 text-stone-700">{LJD_BOOKSHELF_GUIDE_VIEW_BODY}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3">
            <p className="text-sm font-semibold text-stone-900">{LJD_BOOKSHELF_GUIDE_BINDING_TITLE}</p>
            <p className="mt-1.5 text-sm leading-6 text-stone-700">{LJD_BOOKSHELF_GUIDE_BINDING_BODY}</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{LJD_BOOKSHELF_GUIDE_BINDING_NOTE}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">{LJD_BOOKSHELF_GUIDE_CROSSREF}</p>
        <GuideAppLink href="/orders/bookshelf" label="本棚を開く" feature="guide_bookshelf" />
      </>
    ),
  },
  {
    id: "diary-book",
    title: LJD_DIARY_BOOK_GUIDE_SECTION_TITLE,
    summary: LJD_DIARY_BOOK_GUIDE_SECTION_SUMMARY,
    body: (
      <>
        <p>{LJD_DIARY_BOOK_GUIDE_LEAD}</p>
        <ol className="mt-3 space-y-2.5">
          {LJD_DIARY_BOOK_GUIDE_STEPS.map((step, index) => (
            <li key={step.id}>
              <div className="rounded-lg border border-stone-100 bg-[#fffdf9] px-3 py-3 sm:px-4">
                <p className="text-xs font-semibold text-emerald-800/90">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-stone-700">{step.body}</p>
                {step.note ? (
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">{step.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <LjdDiaryBookGuideCoverPreview />
        </div>
        <GuideAppLink href="/orders/bookshelf" label="本棚で本をつくる" feature="guide_bookshelf" />
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
    id: "faq",
    title: "よくある質問",
    summary: "はじめる前に気になりやすいこと",
    body: <HomeFaqSection framed={false} showHeading={false} />,
  },
  {
    id: "help",
    title: "困ったとき",
    summary: "その他のヘルプ",
    body: (
      <>
        <ul className="list-inside list-disc space-y-1 text-stone-700">
          <li>
            <Link
              href="/guide/first/path-guide"
              className="text-emerald-900 underline-offset-2 hover:underline"
            >
              はじめての道しるべ
            </Link>
          </li>
          <li>
            <Link href="/guide" className="text-emerald-900 underline-offset-2 hover:underline">
              使い方（操作手順）
            </Link>
          </li>
          <li>
            <Link
              href="/help/home-screen"
              className="text-emerald-900 underline-offset-2 hover:underline"
            >
              ホーム画面に追加する
            </Link>
          </li>
          <li>
            <Link
              href="/help/pdf-download"
              className="text-emerald-900 underline-offset-2 hover:underline"
            >
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

/** 旧ハッシュ互換（削除した「いっしょに書く」単独項目） */
const LEGACY_HASH_ALIASES: Record<string, string> = {
  "companion-writing": "writing",
};

export function LjdWalkthroughToc() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    const hash = LEGACY_HASH_ALIASES[raw] ?? raw;
    if (!hash || !TOC_ITEMS.some((item) => item.id === hash)) return;
    setOpenId(hash);
    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    });
  }, []);

  return (
    <nav className="relative z-10 space-y-2" aria-label={`${FOREST_GUIDE_STATION_TITLE} 目次`}>
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
                    className={[
                      "border-t border-stone-100 px-3 py-4 sm:px-4 sm:py-5",
                      item.id === "about" ||
                      item.id === "appraisers" ||
                      item.id === "faq" ||
                      item.id === "loghouse"
                        ? ""
                        : "text-sm leading-6 text-stone-700",
                    ].join(" ")}
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

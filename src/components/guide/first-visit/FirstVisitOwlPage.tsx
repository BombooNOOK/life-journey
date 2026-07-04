import Image from "next/image";

import { FirstVisitWizardNav } from "@/components/guide/first-visit/FirstVisitWizardNav";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import {
  FIRST_VISIT_OWL_CLOSING_LINES,
  FIRST_VISIT_OWL_QUOTE,
} from "@/lib/onboarding/firstVisitWizard/owlCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 第3幕：フクロウ先生あいさつ（モバイル=通常ページ、PC=カード） */
export function FirstVisitOwlPage() {
  return (
    <div className="home-read-scope space-y-6 lg:space-y-6">
      <FirstVisitWizardPageHeader
        stepLabel="フクロウ先生あいさつ"
        className="hidden lg:block"
      />

      <section
        className="lg:rounded-2xl lg:border lg:border-stone-200/70 lg:bg-[#fffdf9] lg:p-5 lg:shadow-sm"
        aria-labelledby="first-visit-owl-heading"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="lj-reading-exempt shrink-0 pt-0.5">
            <Image
              src="/decorations/owl-sensei-my-page-header.png"
              alt=""
              aria-hidden
              width={610}
              height={751}
              sizes="(max-width: 640px) 72px, 80px"
              className="h-[4.5rem] w-auto select-none object-contain sm:h-20"
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="lj-read-caption text-stone-500">森のナビゲーター</p>
            <h2
              id="first-visit-owl-heading"
              className="mt-0.5 text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
            >
              フクロウ先生
            </h2>
          </div>
        </div>

        <div className="lj-read-desc mt-4 space-y-4 leading-[1.65] text-stone-600 sm:mt-5 sm:leading-7">
          <p>
            わたしはこの森で、数秘術の鑑定をしている
            <br className="sm:hidden" />
            フクロウ先生です。
          </p>

          <p>
            Life Journey Diaryでは、はじめに
            <br className="sm:hidden" />
            数秘術を使ってあなたが持つ数字を見つけます。
          </p>

          <p className="font-medium text-stone-700">
            でもそれは、
            <br className="sm:hidden" />
            数字に合わせて毎日を決めるためではありません。
          </p>

          <p>
            数字には、それぞれ
            <br className="sm:hidden" />
            意味やテーマがあると考えられています。
          </p>

          <p>
            LJDではそのテーマを、
            <br className="block sm:hidden" />
            日記を見返すときの
            <br className="hidden sm:block" />
            小さな手がかりとして使います。
          </p>

          <p className="border-l-[3px] border-stone-500 pl-3.5 text-[0.95em] italic leading-relaxed text-stone-500 sm:pl-4">
            {FIRST_VISIT_OWL_QUOTE}
          </p>

          <p>
            そんなふうに気づくことで、
            <br className="sm:hidden" />
            なんでもない一日にも、
            <br className="sm:hidden" />
            やさしく光があたります。
          </p>
        </div>

        <div className="lj-read-desc mt-5 space-y-2 leading-[1.7] sm:mt-6 sm:leading-7">
          {FIRST_VISIT_OWL_CLOSING_LINES.map((line) => (
            <p
              key={line.text}
              className={
                line.emphasis === "bold"
                  ? "text-base font-bold text-emerald-900 sm:text-[1.05rem]"
                  : "font-medium text-emerald-800"
              }
            >
              {line.text}
            </p>
          ))}
        </div>

        <p className="lj-read-desc mt-4 text-center font-medium leading-relaxed text-stone-700 sm:mt-5">
          それが、Life Journey Diaryです。
        </p>
      </section>

      <FirstVisitWizardNav
        backHref={FIRST_VISIT_ROUTES.about}
        nextHref={FIRST_VISIT_ROUTES.ready}
      />
    </div>
  );
}

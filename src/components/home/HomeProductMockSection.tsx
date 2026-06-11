import Image from "next/image";
import { Fragment } from "react";

import {
  HOME_PRODUCT_MOCK_STEPS,
  type HomeProductMockStep,
} from "@/lib/home/homeProductMockAssets";

function MockImageFrame({ step }: { step: HomeProductMockStep }) {
  const isPhone = step.frame === "phone";

  if (isPhone) {
    return (
      <div className="mx-auto w-full max-w-[11rem] sm:max-w-[12rem]">
        <div className="overflow-hidden rounded-[1.35rem] border border-stone-300/55 bg-gradient-to-b from-[#f3ead8] to-[#ebe2d0] p-1 shadow-[0_3px_14px_rgba(107,90,74,0.1)]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.1rem] bg-white">
            <Image
              src={step.imageSrc}
              alt={step.imageAlt}
              fill
              sizes="(max-width: 640px) 176px, 192px"
              className="object-cover object-top"
            />
          </div>
        </div>
      </div>
    );
  }

  /** 表紙正面の冊子イメージ（背表紙の厚い本に見せない） */
  return (
    <div className="mx-auto w-full max-w-[9.5rem] sm:max-w-[10.5rem]">
      <div className="overflow-hidden rounded-lg border border-stone-200/55 bg-[#fffdf9] p-1.5 shadow-[0_2px_10px_rgba(107,90,74,0.08)]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-[#faf6ef]">
          <Image
            src={step.imageSrc}
            alt={step.imageAlt}
            fill
            sizes="(max-width: 640px) 152px, 168px"
            className="object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}

function StepNumberBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-semibold leading-none text-white">
      {label}
    </span>
  );
}

function StepFlowArrow() {
  return (
    <div
      className="hidden shrink-0 items-center self-center pt-14 md:flex lg:pt-16"
      aria-hidden
    >
      <div className="flex items-center text-emerald-900/20">
        <span className="w-5 border-t border-dashed border-current lg:w-7" />
        <span className="px-0.5 text-xs leading-none">›</span>
        <span className="w-5 border-t border-dashed border-current lg:w-7" />
      </div>
    </div>
  );
}

function MockStepCard({ step }: { step: HomeProductMockStep }) {
  return (
    <article className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5">
        <StepNumberBadge label={step.stepLabel} />
        <h3 className="text-sm font-semibold leading-snug text-stone-900 sm:text-[15px]">
          {step.title}
        </h3>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-stone-600 sm:text-[13px] sm:leading-6">
        {step.description}
      </p>
      <div className="mt-3 flex flex-1 items-end justify-center sm:mt-4">
        <MockImageFrame step={step} />
      </div>
    </article>
  );
}

/** トップ：記録の流れを実物モックで見せるセクション */
export function HomeProductMockSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <div className="mx-auto max-w-2xl text-center md:text-left">
        <h2 className="text-base font-semibold leading-snug text-stone-900">
          記録は、こんなふうに育っていきます
        </h2>
        <p className="mt-1 text-[10px] text-amber-700/55" aria-hidden>
          ✦
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-600 sm:text-[13px] sm:leading-6">
          その日のきもちや写真を残しながら、あとから読み返せる記録へ。
          <br className="hidden sm:block" />
          そして最後には、手元に残る一冊の日記ブックへ育っていきます。
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-7 sm:mt-6 md:flex-row md:items-stretch md:justify-center md:gap-2 lg:gap-3">
        {HOME_PRODUCT_MOCK_STEPS.map((step, index) => (
          <Fragment key={step.stepLabel}>
            {index > 0 ? <StepFlowArrow /> : null}
            <div className="min-w-0 md:max-w-[13.5rem] md:flex-1 lg:max-w-[15rem]">
              <MockStepCard step={step} />
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

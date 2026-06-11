import Image from "next/image";

import {
  HOME_PRODUCT_MOCK_STEPS,
  type HomeProductMockStep,
} from "@/lib/home/homeProductMockAssets";

function MockImageFrame({ step }: { step: HomeProductMockStep }) {
  const isPhone = step.frame === "phone";

  return (
    <div
      className={[
        "mx-auto w-full",
        isPhone ? "max-w-[10.5rem] sm:max-w-[11.5rem]" : "max-w-[8.5rem] sm:max-w-[9.5rem]",
      ].join(" ")}
    >
      <div
        className={[
          "overflow-hidden rounded-2xl border border-stone-200/65 bg-[#fffdf9] shadow-[0_2px_10px_rgba(107,90,74,0.07)]",
          isPhone ? "p-1.5" : "p-2",
        ].join(" ")}
      >
        <div
          className={[
            "relative overflow-hidden rounded-xl bg-[#faf6ef]",
            isPhone ? "aspect-[9/19]" : "aspect-[3/4]",
          ].join(" ")}
        >
          <Image
            src={step.imageSrc}
            alt={step.imageAlt}
            fill
            sizes={isPhone ? "(max-width: 640px) 168px, 184px" : "(max-width: 640px) 136px, 152px"}
            className={isPhone ? "object-cover object-top" : "object-cover"}
          />
        </div>
      </div>
    </div>
  );
}

function MockStepCard({ step }: { step: HomeProductMockStep }) {
  return (
    <article className="flex min-w-0 flex-col">
      <p className="text-[11px] font-medium tracking-wide text-emerald-800/80">{step.stepLabel}</p>
      <h3 className="mt-1 text-sm font-semibold leading-snug text-stone-900 sm:text-[15px]">
        {step.title}
      </h3>
      <p className="mt-1.5 text-xs leading-5 text-stone-600 sm:text-[13px] sm:leading-6">
        {step.description}
      </p>
      <div className="mt-3 flex flex-1 items-end sm:mt-4">
        <MockImageFrame step={step} />
      </div>
    </article>
  );
}

/** トップ：記録の流れを実物モックで見せるセクション */
export function HomeProductMockSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <div className="max-w-2xl">
        <h2 className="text-base font-semibold leading-snug text-stone-900">
          記録は、こんなふうに育っていきます
        </h2>
        <p className="mt-2 text-xs leading-5 text-stone-600 sm:text-[13px] sm:leading-6">
          その日のきもちや写真を残しながら、あとから読み返せる記録へ。
          <br className="hidden sm:block" />
          そして最後には、手元に残る一冊の日記ブックへ育っていきます。
        </p>
      </div>

      <div className="relative mt-5 sm:mt-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[16%] right-[16%] top-[42%] hidden h-px bg-gradient-to-r from-transparent via-emerald-900/12 to-transparent md:block"
        />

        <ol className="grid gap-6 sm:gap-7 md:grid-cols-3 md:gap-4 lg:gap-5">
          {HOME_PRODUCT_MOCK_STEPS.map((step) => (
            <li key={step.stepLabel}>
              <MockStepCard step={step} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { PhoneMockScrollViewport } from "@/components/home/PhoneMockScrollViewport";
import {
  HOME_PRODUCT_MOCK_STEPS,
  type HomeProductMockStep,
} from "@/lib/home/homeProductMockAssets";

const PHONE_MOCK_OUTER_CLASS =
  "overflow-hidden rounded-[1.35rem] border border-stone-300/55 bg-gradient-to-b from-[#f3ead8] to-[#ebe2d0] p-1 shadow-[0_3px_14px_rgba(107,90,74,0.1)]";

const PHONE_MOCK_SCREEN_CLASS =
  "relative aspect-[9/19.5] overflow-hidden rounded-[1.1rem] bg-white";

const PRIMARY_STEPS = HOME_PRODUCT_MOCK_STEPS.slice(0, 3);
const FINAL_STEP = HOME_PRODUCT_MOCK_STEPS[3]!;

function PhoneMockScrollHint() {
  return (
    <p className="mb-1.5 text-center text-[10px] leading-4 text-stone-500/80">
      枠内を上下にスクロール
    </p>
  );
}

function PhoneMockScreenshot({
  step,
  className,
  draggable = false,
}: {
  step: HomeProductMockStep;
  className?: string;
  draggable?: boolean;
}) {
  return (
    <img
      src={step.imageSrc}
      alt={step.imageAlt}
      width={step.imageWidth}
      height={step.imageHeight}
      className={["[image-rendering:auto]", className].filter(Boolean).join(" ")}
      loading="lazy"
      decoding="async"
      draggable={draggable}
    />
  );
}

function PhoneMockFrame({
  step,
  desktopWidth = "min(12rem, 390px)",
}: {
  step: HomeProductMockStep;
  desktopWidth?: string;
}) {
  const mockWidthMobile = `min(72vw, ${step.imageWidth}px)`;

  return (
    <div className="w-full">
      <div
        className="mx-auto shrink-0 md:hidden"
        style={{ width: mockWidthMobile }}
      >
        <PhoneMockScrollHint />
        <div className={PHONE_MOCK_OUTER_CLASS}>
          <div className={PHONE_MOCK_SCREEN_CLASS}>
            <PhoneMockScrollViewport label={`${step.imageAlt}のプレビュー`}>
              <PhoneMockScreenshot
                step={step}
                className="block h-auto w-full max-w-none"
                draggable={false}
              />
            </PhoneMockScrollViewport>
          </div>
        </div>
      </div>

      <div
        className="mx-auto hidden shrink-0 md:block"
        style={{ width: desktopWidth }}
      >
        <PhoneMockScrollHint />
        <div className={PHONE_MOCK_OUTER_CLASS}>
          <div className={PHONE_MOCK_SCREEN_CLASS}>
            <PhoneMockScrollViewport label={`${step.imageAlt}のプレビュー`}>
              <PhoneMockScreenshot
                step={step}
                className="block h-auto w-full max-w-none"
                draggable={false}
              />
            </PhoneMockScrollViewport>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockImageFrame({
  step,
  desktopPhoneWidth,
}: {
  step: HomeProductMockStep;
  desktopPhoneWidth?: string;
}) {
  if (step.frame === "phone") {
    return <PhoneMockFrame step={step} desktopWidth={desktopPhoneWidth} />;
  }

  return (
    <div className="mx-auto w-full min-w-[9rem] max-w-[9rem] shrink-0 sm:max-w-[10rem] md:min-w-[10rem] md:max-w-[11rem]">
      <div className="overflow-hidden rounded-lg border border-stone-200/55 bg-[#fffdf9] p-1.5 shadow-[0_2px_10px_rgba(107,90,74,0.08)]">
        <img
          src={step.imageSrc}
          alt={step.imageAlt}
          width={step.imageWidth}
          height={step.imageHeight}
          className="block h-auto w-full rounded-md bg-[#faf6ef] object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function MockStepCard({
  step,
  alignMockToBottom = false,
  desktopPhoneWidth,
}: {
  step: HomeProductMockStep;
  alignMockToBottom?: boolean;
  desktopPhoneWidth?: string;
}) {
  return (
    <article className={alignMockToBottom ? "flex h-full min-w-0 flex-col" : "flex min-w-0 flex-col"}>
      <h3 className="text-[0.9375rem] font-semibold leading-snug text-emerald-800">
        {step.stepLabel} {step.title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-5 text-stone-600 sm:text-sm sm:leading-6">
        {step.description}
      </p>
      <div
        className={[
          alignMockToBottom
            ? "mt-2.5 flex flex-1 items-end justify-center sm:mt-3"
            : "mt-2.5 flex w-full justify-center sm:mt-3",
        ].join(" ")}
      >
        <div className={step.frame === "phone" ? "lj-reading-exempt shrink-0" : "shrink-0"}>
          <MockImageFrame step={step} desktopPhoneWidth={desktopPhoneWidth} />
        </div>
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
          記録はこんなふうに育っていきます
        </h2>
        <p className="mt-1 text-[13px] text-amber-700/55" aria-hidden>
          ✦
        </p>
        <p className="mt-2 text-[13px] leading-5 text-stone-600 sm:text-sm sm:leading-6">
          その日のきもちや写真を残し、読み返し、本棚に並べ、手元の一冊へ。
        </p>
      </div>

      <div className="mx-auto mt-5 max-w-5xl sm:mt-6">
        <div className="grid grid-cols-1 gap-6 md:hidden">
          {HOME_PRODUCT_MOCK_STEPS.map((step) => (
            <MockStepCard key={step.stepLabel} step={step} />
          ))}
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-5 lg:gap-6">
            {PRIMARY_STEPS.map((step) => (
              <div key={step.stepLabel} className="min-w-0 max-w-[15rem] justify-self-center lg:max-w-[16rem]">
                <MockStepCard step={step} alignMockToBottom desktopPhoneWidth="min(12.5rem, 390px)" />
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-stone-200/70 pt-8">
            <div className="mx-auto max-w-sm">
              <MockStepCard step={FINAL_STEP} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

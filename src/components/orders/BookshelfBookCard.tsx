"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";

export type BookshelfBookDetailRow = {
  label: string;
  value: string;
};

type Props = {
  id: string;
  kind: "diary-book" | "report";
  title: string;
  /** タイトルと「読む」の間に表示（例: あしあとブックの対象期間） */
  periodLabel?: string;
  href: string;
  tone: "emerald" | "amber";
  coverImageSrc?: string | null;
  coverAlt: string;
  details: BookshelfBookDetailRow[];
  /** 読むボタンの文言（鑑定書は「鑑定結果を見る」など） */
  readButtonLabel?: string;
  /** 読む押下時のフクロウ文言 */
  readLoadingLabel?: string;
  /** 製本注文押下時のフクロウ文言 */
  bindingLoadingLabel?: string;
  /** PDFプレビュー押下時のフクロウ文言 */
  quickPreviewLoadingLabel?: string;
  /** カード本体に常時表示する補助導線（例: PDFプレビュー） */
  quickPreviewHref?: string;
  quickPreviewLabel?: string;
  /** quickPreviewHref の直下に小さく表示する補足 */
  quickPreviewHelpText?: string;
  /** true のとき新しいタブで開く（鑑定書PDFのブラウザ表示向け） */
  quickPreviewOpenInNewTab?: boolean;
  /** カード上の製本注文（主導線の次） */
  bindingHref?: string;
  bindingLabel?: string;
  bindingDisabled?: boolean;
  /** 400ページ超など、注文リンクを出せないときの案内 */
  bindingUnavailableMessage?: string;
  /** 概要を開いたときだけ表示（PDFボタン等） */
  overviewExtra?: ReactNode;
};

const BINDING_BUTTON_CLASS =
  "flex min-h-[38px] items-center justify-center rounded-lg border border-violet-300/90 bg-[#faf8f5] px-3 text-sm font-medium text-violet-900 transition hover:border-violet-400 hover:bg-violet-50/80";

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

const KIND_LABEL = {
  "diary-book": "あしあとブック",
  report: "鑑定書",
} as const;

function BookCoverFallback({ tone, kind }: { tone: Props["tone"]; kind: Props["kind"] }) {
  return (
    <div
      className={[
        "flex aspect-[724/1024] w-full flex-col items-center justify-center rounded-sm border text-center",
        tone === "emerald"
          ? "border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-emerald-100/80"
          : "border-amber-200/80 bg-gradient-to-b from-amber-50 to-amber-100/80",
      ].join(" ")}
      aria-hidden
    >
      <span className="text-2xl">{kind === "diary-book" ? "📗" : "📙"}</span>
      <span className="mt-1 px-2 text-[10px] font-medium text-stone-600">{KIND_LABEL[kind]}</span>
    </div>
  );
}

export function BookshelfBookCard({
  id,
  kind,
  title,
  periodLabel,
  href,
  tone,
  coverImageSrc,
  coverAlt,
  details,
  readButtonLabel = "読む",
  readLoadingLabel = "開いています…",
  bindingLoadingLabel = "注文ページを準備しています…",
  quickPreviewLoadingLabel = "PDFを準備しています…",
  quickPreviewHref,
  quickPreviewLabel = "プレビューで読む",
  quickPreviewHelpText,
  quickPreviewOpenInNewTab = false,
  bindingHref,
  bindingLabel = "製本版を注文する",
  bindingDisabled = false,
  bindingUnavailableMessage,
  overviewExtra,
}: Props) {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLLIElement>(null);

  const closeOverview = useCallback(() => setOverviewOpen(false), []);

  useEffect(() => {
    if (!overviewOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      closeOverview();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverview();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [overviewOpen, closeOverview]);

  const borderClass = tone === "emerald" ? "border-emerald-100" : "border-amber-100";
  const readButtonClass =
    tone === "emerald"
      ? "bg-emerald-800 hover:bg-emerald-900"
      : "bg-amber-800 hover:bg-amber-900";

  return (
    <li ref={rootRef} className="list-none">
      <article
        className={[
          "flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
          borderClass,
        ].join(" ")}
      >
        <div className="relative mx-auto w-[58%] max-w-[140px] pt-4 sm:w-[52%]">
          {coverImageSrc ? (
            <div className="relative aspect-[724/1024] overflow-hidden rounded-sm border border-stone-200/80 bg-stone-100 shadow-sm">
              <Image
                src={coverImageSrc}
                alt={coverAlt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 28vw, 140px"
              />
            </div>
          ) : (
            <BookCoverFallback tone={tone} kind={kind} />
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
          <p
            className={[
              "text-center text-[10px] font-medium tracking-wide",
              tone === "emerald" ? "text-emerald-800" : "text-amber-900",
            ].join(" ")}
          >
            {KIND_LABEL[kind]}
          </p>
          <h2 className="mt-1 line-clamp-2 text-center text-sm font-semibold leading-snug text-stone-900">
            {title}
          </h2>
          {periodLabel ? (
            <p className="mt-2 text-center text-[11px] leading-snug text-stone-500">{periodLabel}</p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 pt-3">
            <OwlNavButton
              href={href}
              loadingLabel={
                kind === "diary-book" ? "あしあとブックを開いています…" : readLoadingLabel
              }
              className={[
                "flex min-h-[40px] w-full items-center justify-center rounded-lg px-3 text-sm font-medium text-white",
                readButtonClass,
              ].join(" ")}
            >
              {readButtonLabel}
            </OwlNavButton>
            {quickPreviewHref && quickPreviewHelpText ? (
              <p className="text-center text-[11px] leading-snug text-stone-500">
                {quickPreviewHelpText}
              </p>
            ) : null}
            {bindingUnavailableMessage ? (
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-center text-[11px] leading-snug text-stone-600">
                {bindingUnavailableMessage}
              </p>
            ) : bindingHref || bindingDisabled ? (
              bindingHref && !bindingDisabled ? (
                isExternalHref(bindingHref) ? (
                  <a
                    href={bindingHref}
                    target="_blank"
                    rel="noreferrer"
                    className={BINDING_BUTTON_CLASS}
                  >
                    {bindingLabel}
                  </a>
                ) : (
                  <OwlNavButton
                    href={bindingHref}
                    loadingLabel={bindingLoadingLabel}
                    className={["w-full", BINDING_BUTTON_CLASS].join(" ")}
                  >
                    {bindingLabel}
                  </OwlNavButton>
                )
              ) : (
                <button
                  type="button"
                  disabled={bindingDisabled}
                  className={[
                    BINDING_BUTTON_CLASS,
                    bindingDisabled ? "cursor-not-allowed opacity-70" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {bindingLabel}
                </button>
              )
            ) : null}
            {quickPreviewHref ? (
              <OwlNavButton
                href={quickPreviewHref}
                loadingLabel={quickPreviewLoadingLabel}
                openInNewTab={quickPreviewOpenInNewTab}
                prefetch={!quickPreviewOpenInNewTab}
                className="w-full text-center text-xs font-medium text-stone-700 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                {quickPreviewLabel}
              </OwlNavButton>
            ) : null}
            <button
              type="button"
              aria-expanded={overviewOpen}
              aria-controls={overviewOpen ? panelId : undefined}
              onClick={() => setOverviewOpen((v) => !v)}
              className="text-center text-xs text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
            >
              {overviewOpen ? "概要を閉じる" : "概要"}
            </button>
          </div>
        </div>

        {overviewOpen ? (
          <div
            id={panelId}
            className="border-t border-stone-100 bg-stone-50/80 px-3 py-3 text-xs text-stone-700"
          >
            <dl className="space-y-1.5">
              {details.map((row) => (
                <div key={`${id}-${row.label}`} className="flex gap-2">
                  <dt className="w-[4.5rem] shrink-0 text-stone-500">{row.label}</dt>
                  <dd className="min-w-0 flex-1 text-stone-800">{row.value}</dd>
                </div>
              ))}
            </dl>
            {overviewExtra ? <div className="mt-3 space-y-2 border-t border-stone-200/80 pt-3">{overviewExtra}</div> : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}

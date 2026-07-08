/**
 * 第1幕 welcome の素材。
 * 地図 PNG に看板・フクロウ・施設名は Canva 込み。ウェルカム文だけ HTML で重ねる。
 */
export type FirstVisitWelcomeViewport = "mobile" | "desktop";

export const FIRST_VISIT_WELCOME_BG_SRC: Record<FirstVisitWelcomeViewport, string> = {
  mobile: "/images/ljd/first-visit/welcome/bg_map_mobile.png",
  desktop: "/images/ljd/first-visit/welcome/bg_map_desktop.png",
};

/** Canva 書き出し PNG の実ピクセルサイズ（座標合わせの基準） */
export const FIRST_VISIT_WELCOME_BG_INTRINSIC: Record<
  FirstVisitWelcomeViewport,
  { widthPx: number; heightPx: number }
> = {
  mobile: { widthPx: 576, heightPx: 1024 },
  desktop: { widthPx: 1024, heightPx: 576 },
};

export function firstVisitWelcomeBgSrc(viewport: FirstVisitWelcomeViewport): string {
  return FIRST_VISIT_WELCOME_BG_SRC[viewport];
}

/** 看板内に重ねるウェルカム文（PC：改行位置あり） */
export const FIRST_VISIT_WELCOME_COPY = {
  heading: "BambooNOOKの森へようこそ",
  paragraphs: [
    "ここでは、Life Journey Diaryのはじめ方を\nナビゲーターのフクロウ先生がご案内します。",
    "写真と言葉で、今日の1ページを残すところまで\nしっかりお供しますので、ご安心ください。",
    "それでは、森の中へ進んでみましょう。",
  ],
  nextLabel: "次へ",
  backLabel: "もどる",
} as const;

/** モバイル object-cover 時のフォーカス（下部看板が見えるようやや下寄せ） */
export const FIRST_VISIT_WELCOME_BG_OBJECT_POSITION: Record<
  FirstVisitWelcomeViewport,
  { xPercent: number; yPercent: number }
> = {
  mobile: { xPercent: 50, yPercent: 54 },
  desktop: { xPercent: 50, yPercent: 50 },
};

/** モバイル：指定の改行位置（空白行は表示側で高さ調整） */
export const FIRST_VISIT_WELCOME_COPY_MOBILE = {
  heading: FIRST_VISIT_WELCOME_COPY.heading,
  body: [
    "今日の1ページを残すところまで、",
    "ナビゲーターのフクロウ先生がご案内します。",
    "",
    "森の中へ進んでみましょう。",
  ].join("\n"),
  nextLabel: FIRST_VISIT_WELCOME_COPY.nextLabel,
} as const;

export type FirstVisitWelcomeCopy =
  | typeof FIRST_VISIT_WELCOME_COPY
  | typeof FIRST_VISIT_WELCOME_COPY_MOBILE;

export function firstVisitWelcomeCopyFor(viewport: FirstVisitWelcomeViewport): FirstVisitWelcomeCopy {
  return viewport === "mobile" ? FIRST_VISIT_WELCOME_COPY_MOBILE : FIRST_VISIT_WELCOME_COPY;
}

export function isFirstVisitWelcomeMobileCopy(
  copy: FirstVisitWelcomeCopy,
): copy is typeof FIRST_VISIT_WELCOME_COPY_MOBILE {
  return "body" in copy;
}

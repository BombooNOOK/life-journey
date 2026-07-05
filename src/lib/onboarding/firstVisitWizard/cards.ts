import {
  FIRST_VISIT_KANTEI_HALL_BODY,
  FIRST_VISIT_KANTEI_HALL_BUTTON,
  FIRST_VISIT_KANTEI_HALL_ILLUSTRATION_SRC,
  FIRST_VISIT_KANTEI_HALL_TITLE,
  FIRST_VISIT_KANTEI_PROCEED_BODY,
  FIRST_VISIT_KANTEI_PROCEED_BUTTON,
  FIRST_VISIT_KANTEI_PROCEED_TITLE,
} from "@/lib/onboarding/firstVisitWizard/kanteiHallCopy";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_NOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_QUOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_BUTTON,
  FIRST_VISIT_RESIDENT_REGISTRATION_SUPPLEMENT,
  FIRST_VISIT_RESIDENT_REGISTRATION_TITLE,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";

export type FirstVisitGuideCardAction =
  | "next"
  | "dismiss"
  | "register"
  | "login";

export type FirstVisitGuideCardButton = {
  label: string;
  action: FirstVisitGuideCardAction;
  variant?: "primary" | "secondary" | "tertiary";
};

export type FirstVisitGuideCard = {
  id: string;
  title?: string;
  body?: string;
  /** フクロウ先生のことば（引用スタイル） */
  owlQuote?: string;
  footnote?: string;
  illustrationSrc?: string;
  buttons: FirstVisitGuideCardButton[];
};

/** 第4幕：鑑定のやかた案内 */
export const FIRST_VISIT_KANTEI_HALL_INTRO_CARD: FirstVisitGuideCard = {
  id: "kantei-hall-intro",
  title: FIRST_VISIT_KANTEI_HALL_TITLE,
  body: FIRST_VISIT_KANTEI_HALL_BODY,
  illustrationSrc: FIRST_VISIT_KANTEI_HALL_ILLUSTRATION_SRC,
  buttons: [{ label: FIRST_VISIT_KANTEI_HALL_BUTTON, action: "next", variant: "primary" }],
};

/** 第4幕：未登録ユーザー向け */
export const FIRST_VISIT_RESIDENT_REGISTRATION_CARD: FirstVisitGuideCard = {
  id: "auth-branch",
  title: FIRST_VISIT_RESIDENT_REGISTRATION_TITLE,
  owlQuote: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_QUOTE,
  body: FIRST_VISIT_RESIDENT_REGISTRATION_SUPPLEMENT,
  footnote: FIRST_VISIT_RESIDENT_REGISTRATION_NOTE,
  buttons: [
    { label: FIRST_VISIT_RESIDENT_REGISTRATION_BUTTON, action: "register", variant: "primary" },
    { label: "ログインして鑑定へ", action: "login", variant: "secondary" },
  ],
};

/** 第4幕：ログイン済み・未鑑定ユーザー向け */
export const FIRST_VISIT_KANTEI_PROCEED_READY_CARD: FirstVisitGuideCard = {
  id: "kantei-proceed-ready",
  title: FIRST_VISIT_KANTEI_PROCEED_TITLE,
  body: FIRST_VISIT_KANTEI_PROCEED_BODY,
  buttons: [{ label: FIRST_VISIT_KANTEI_PROCEED_BUTTON, action: "next", variant: "primary" }],
};

/** 第5幕：ログハウス建築 */
export const FIRST_VISIT_LOGHOUSE_BUILD_CARDS: FirstVisitGuideCard[] = [
  {
    id: "loghouse-build",
    body: "あなただけのログハウスを建てています。\n日記や鑑定書をしまっておく、あなたの拠点です。",
    buttons: [{ label: "次へ", action: "next", variant: "primary" }],
  },
  {
    id: "loghouse-built",
    body: "ログハウスができました。",
    buttons: [{ label: "次へ", action: "next", variant: "primary" }],
  },
];

/** 第6幕：ログハウス建築後 */
export const FIRST_VISIT_KANTEI_PROCEED_CARD: FirstVisitGuideCard = {
  id: "kantei-proceed",
  body: "それでは、鑑定に進みましょう",
  buttons: [{ label: "次へ", action: "next", variant: "primary" }],
};

/** 第8幕：/order 工程案内（最小限） */
export const FIRST_VISIT_ORDER_GUIDE_CARDS: FirstVisitGuideCard[] = [
  {
    id: "order-birthdate",
    body: "ここで生年月日を入力します",
    buttons: [{ label: "わかりました", action: "dismiss", variant: "primary" }],
  },
  {
    id: "order-confirm",
    body: "入力が終わったら、次に進みましょう",
    buttons: [{ label: "次へ", action: "dismiss", variant: "primary" }],
  },
  {
    id: "order-result-hint",
    body: "鑑定が終わると、どうぶつ鑑定士からのことばが届きます",
    buttons: [{ label: "次へ", action: "dismiss", variant: "primary" }],
  },
];

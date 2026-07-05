import {
  FIRST_VISIT_KANTEI_HALL_BODY,
  FIRST_VISIT_KANTEI_HALL_BUTTON,
  FIRST_VISIT_KANTEI_HALL_SIGN_LABEL,
  FIRST_VISIT_ALREADY_READY_HOME_BUTTON,
  FIRST_VISIT_ALREADY_READY_ORDERS_BUTTON,
  FIRST_VISIT_ALREADY_READY_OWL_QUOTE,
  FIRST_VISIT_KANTEI_PROCEED_BODY,
  FIRST_VISIT_KANTEI_PROCEED_BUTTON,
  FIRST_VISIT_KANTEI_PROCEED_TITLE,
} from "@/lib/onboarding/firstVisitWizard/kanteiHallCopy";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_NOTE,
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT,
  FIRST_VISIT_RESIDENT_REGISTRATION_BUTTON,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";

export type FirstVisitGuideCardAction =
  | "next"
  | "dismiss"
  | "register"
  | "login"
  | "orders"
  | "home";

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
  /** 森の一本矢印看板に載せる行き先名（設定時は看板カード表示） */
  signLabel?: string;
  /** フクロウコメント枠 PNG 内に載せるテキスト */
  owlCommentLabel?: string;
  /** true のときカード枠なし（看板＋本文をそのまま表示） */
  bare?: boolean;
  illustrationSrc?: string;
  /** 本文の揃え（既定: 左） */
  bodyAlign?: "left" | "center";
  buttons: FirstVisitGuideCardButton[];
};

/** 第4幕：鑑定のやかた案内 */
export const FIRST_VISIT_KANTEI_HALL_INTRO_CARD: FirstVisitGuideCard = {
  id: "kantei-hall-intro",
  signLabel: FIRST_VISIT_KANTEI_HALL_SIGN_LABEL,
  body: FIRST_VISIT_KANTEI_HALL_BODY,
  bodyAlign: "center",
  bare: true,
  buttons: [{ label: FIRST_VISIT_KANTEI_HALL_BUTTON, action: "next", variant: "primary" }],
};

/** 第4幕：未登録ユーザー向け */
export const FIRST_VISIT_RESIDENT_REGISTRATION_CARD: FirstVisitGuideCard = {
  id: "auth-branch",
  owlCommentLabel: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT,
  footnote: FIRST_VISIT_RESIDENT_REGISTRATION_NOTE,
  bare: true,
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

/** 第4幕：住民登録・鑑定済みユーザー向け */
export const FIRST_VISIT_ALREADY_READY_CARD: FirstVisitGuideCard = {
  id: "already-ready",
  owlQuote: FIRST_VISIT_ALREADY_READY_OWL_QUOTE,
  buttons: [
    { label: FIRST_VISIT_ALREADY_READY_ORDERS_BUTTON, action: "orders", variant: "primary" },
    { label: FIRST_VISIT_ALREADY_READY_HOME_BUTTON, action: "home", variant: "secondary" },
  ],
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

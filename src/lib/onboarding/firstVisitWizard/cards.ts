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
  FIRST_VISIT_LOGHOUSE_COMPLETE_BODY,
  FIRST_VISIT_LOGHOUSE_COMPLETE_BUTTON,
  FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC,
  FIRST_VISIT_LOGHOUSE_COMPLETE_TITLE,
} from "@/lib/onboarding/firstVisitWizard/loghouseCompleteCopy";
import {
  FIRST_VISIT_LOGHOUSE_SIGN_BUTTON,
  FIRST_VISIT_LOGHOUSE_SIGN_LABEL,
} from "@/lib/onboarding/firstVisitWizard/residentCardCopy";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT,
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_PROMPT_LOGIN_BUTTON,
} from "@/lib/onboarding/firstVisitWizard/residentRegistrationCopy";
import {
  BOOKSHELF_KANTEI_GUIDE_CARD1_BODY,
  BOOKSHELF_KANTEI_GUIDE_CARD1_BUTTON,
  BOOKSHELF_KANTEI_GUIDE_CARD1_ILLUSTRATION_SRC,
  BOOKSHELF_KANTEI_GUIDE_CARD1_TITLE,
  BOOKSHELF_KANTEI_GUIDE_CARD2_BODY,
  BOOKSHELF_KANTEI_GUIDE_CARD2_ILLUSTRATION_SRC,
  BOOKSHELF_KANTEI_GUIDE_CARD2_PRIMARY_BUTTON,
  BOOKSHELF_KANTEI_GUIDE_CARD2_SECONDARY_BUTTON,
  BOOKSHELF_KANTEI_GUIDE_CARD2_TITLE,
} from "@/lib/onboarding/bookshelfKanteiGuideCopy";

export type FirstVisitGuideCardAction =
  | "next"
  | "dismiss"
  | "register"
  | "login"
  | "orders"
  | "home"
  | "companion_journal"
  | "stay_bookshelf";

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
  /** 看板テキストで改行を保持する */
  signMultiline?: boolean;
  /** フクロウコメント枠 PNG 内に載せるテキスト */
  owlCommentLabel?: string;
  /** true のときカード枠なし（看板＋本文をそのまま表示） */
  bare?: boolean;
  illustrationSrc?: string;
  /** true のときイラストをカード上部で大きめに表示 */
  illustrationLarge?: boolean;
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

/** 第4幕：未登録ユーザー向け（ready ページ・フクロウ案内のみ） */
export const FIRST_VISIT_RESIDENT_OWL_PROMPT_CARD: FirstVisitGuideCard = {
  id: "resident-owl-prompt",
  owlCommentLabel: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_TEXT,
  bare: true,
  buttons: [
    { label: "次へ", action: "next", variant: "primary" },
    {
      label: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_PROMPT_LOGIN_BUTTON,
      action: "login",
      variant: "secondary",
    },
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

/** 第5幕：ログハウス建築前の看板（フクロウ先生コメント枠） */
export const FIRST_VISIT_LOGHOUSE_SIGN_CARD: FirstVisitGuideCard = {
  id: "loghouse-sign",
  owlCommentLabel: FIRST_VISIT_LOGHOUSE_SIGN_LABEL,
  bare: true,
  buttons: [{ label: FIRST_VISIT_LOGHOUSE_SIGN_BUTTON, action: "next", variant: "primary" }],
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
  title: FIRST_VISIT_LOGHOUSE_COMPLETE_TITLE,
  body: FIRST_VISIT_LOGHOUSE_COMPLETE_BODY,
  illustrationSrc: FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC,
  illustrationLarge: true,
  bodyAlign: "center",
  buttons: [{ label: FIRST_VISIT_LOGHOUSE_COMPLETE_BUTTON, action: "next", variant: "primary" }],
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

/** 鑑定完了直後：本棚で鑑定書が並んだあとの案内 */
export const BOOKSHELF_KANTEI_COMPLETE_GUIDE_CARDS: FirstVisitGuideCard[] = [
  {
    id: "bookshelf-kantei-arrived",
    title: BOOKSHELF_KANTEI_GUIDE_CARD1_TITLE,
    body: BOOKSHELF_KANTEI_GUIDE_CARD1_BODY,
    illustrationSrc: BOOKSHELF_KANTEI_GUIDE_CARD1_ILLUSTRATION_SRC,
    illustrationLarge: true,
    buttons: [{ label: BOOKSHELF_KANTEI_GUIDE_CARD1_BUTTON, action: "next", variant: "primary" }],
  },
  {
    id: "bookshelf-kantei-journal",
    title: BOOKSHELF_KANTEI_GUIDE_CARD2_TITLE,
    body: BOOKSHELF_KANTEI_GUIDE_CARD2_BODY,
    illustrationSrc: BOOKSHELF_KANTEI_GUIDE_CARD2_ILLUSTRATION_SRC,
    illustrationLarge: true,
    buttons: [
      {
        label: BOOKSHELF_KANTEI_GUIDE_CARD2_PRIMARY_BUTTON,
        action: "companion_journal",
        variant: "primary",
      },
      {
        label: BOOKSHELF_KANTEI_GUIDE_CARD2_SECONDARY_BUTTON,
        action: "stay_bookshelf",
        variant: "secondary",
      },
    ],
  },
];

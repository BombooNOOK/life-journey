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
  body: string;
  buttons: FirstVisitGuideCardButton[];
};

/** 第4幕：鑑定前の案内カード */
export const FIRST_VISIT_KANTEI_READY_CARDS: FirstVisitGuideCard[] = [
  {
    id: "kantei-start",
    body: "それでは、鑑定に進みます",
    buttons: [{ label: "次へ", action: "next", variant: "primary" }],
  },
  {
    id: "auth-branch",
    body: "まだログハウスをお持ちでない方は、\n先にアカウントを作成しましょう。",
    buttons: [
      { label: "アカウント作成", action: "register", variant: "primary" },
      { label: "ログインして鑑定へ", action: "login", variant: "secondary" },
    ],
  },
];

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

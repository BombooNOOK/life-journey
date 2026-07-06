const ORDER_GUIDE_FLAG = "ljd:firstGuide:orderGuide";
const FROM_REGISTER_FLAG = "ljd:firstGuide:fromRegister";
const WELCOME_EMAIL_SENT_FLAG = "ljd:firstGuide:welcomeEmailSent";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** /order 上の案内カードを表示するか */
export function readFirstVisitOrderGuideFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(ORDER_GUIDE_FLAG) === "1";
}

export function setFirstVisitOrderGuideFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(ORDER_GUIDE_FLAG, "1");
}

export function clearFirstVisitOrderGuideFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ORDER_GUIDE_FLAG);
}

/** アカウント作成直後にログハウス建築演出を出すか */
export function readFirstVisitFromRegisterFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(FROM_REGISTER_FLAG) === "1";
}

export function setFirstVisitFromRegisterFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(FROM_REGISTER_FLAG, "1");
}

export function clearFirstVisitFromRegisterFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(FROM_REGISTER_FLAG);
}

/** 登録完了メール送信の有無（住民票カードページの補足表示用） */
export function readFirstVisitWelcomeEmailSentFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(WELCOME_EMAIL_SENT_FLAG) === "1";
}

export function setFirstVisitWelcomeEmailSentFlag(sent: boolean): void {
  if (!canUseSessionStorage()) return;
  if (sent) {
    window.sessionStorage.setItem(WELCOME_EMAIL_SENT_FLAG, "1");
  } else {
    window.sessionStorage.removeItem(WELCOME_EMAIL_SENT_FLAG);
  }
}

export function clearFirstVisitWelcomeEmailSentFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(WELCOME_EMAIL_SENT_FLAG);
}

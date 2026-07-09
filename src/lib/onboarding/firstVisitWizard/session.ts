import {
  ONBOARDING_CHAPTER1_COMPLETE_COOKIE,
  ONBOARDING_CHAPTER1_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/onboarding/onboardingStageCookies";

const ORDER_GUIDE_FLAG = "ljd:firstGuide:orderGuide";
const BOOKSHELF_KANTEI_GUIDE_FLAG = "ljd:firstGuide:bookshelfKanteiGuide";
const FROM_REGISTER_FLAG = "ljd:firstGuide:fromRegister";
const FROM_REGISTER_COOKIE = "lj_first_visit_from_register";
const WELCOME_EMAIL_SENT_FLAG = "ljd:firstGuide:welcomeEmailSent";
const RESIDENT_CARD_VIDEO_DONE_FLAG = "ljd:firstGuide:residentCardVideoDone";
const CHAPTER_COMPLETE_PREFIX = "ljd:firstGuide:chapterComplete:";
const CHAPTER_3_STARTED_FLAG = "ljd:firstGuide:chapter3Started";
const PROLOGUE_WATCHED_FLAG = "ljd:firstGuide:pathGuidePrologueWatched";
const PATH_GUIDE_WRITING_HABIT_DISMISSED_FLAG = "ljd:firstGuide:pathGuideWritingHabitDismissed";
const FROM_REGISTER_COOKIE_MAX_AGE_SECONDS = 120;

export type FirstVisitChapterNumber = 1 | 2 | 3;

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function cookieSecureSuffix(): string {
  if (typeof window === "undefined") return "";
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function readFromRegisterCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim() === `${FROM_REGISTER_COOKIE}=1`);
}

function writeFromRegisterCookie(): void {
  if (typeof document === "undefined") return;
  const s = cookieSecureSuffix();
  document.cookie = `${FROM_REGISTER_COOKIE}=1; Path=/; Max-Age=${FROM_REGISTER_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${s}`;
}

function clearFromRegisterCookie(): void {
  if (typeof document === "undefined") return;
  const s = cookieSecureSuffix();
  document.cookie = `${FROM_REGISTER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${s}`;
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

/** 鑑定保存直後に本棚で2枚の案内カードを出すか */
export function readBookshelfKanteiGuideFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(BOOKSHELF_KANTEI_GUIDE_FLAG) === "1";
}

export function setBookshelfKanteiGuideFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(BOOKSHELF_KANTEI_GUIDE_FLAG, "1");
}

export function clearBookshelfKanteiGuideFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(BOOKSHELF_KANTEI_GUIDE_FLAG);
}

/** アカウント作成直後にログハウス建築演出を出すか（sessionStorage + 短命 Cookie） */
export function readFirstVisitFromRegisterFlag(): boolean {
  if (canUseSessionStorage() && window.sessionStorage.getItem(FROM_REGISTER_FLAG) === "1") {
    return true;
  }
  return readFromRegisterCookie();
}

export function setFirstVisitFromRegisterFlag(): void {
  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(FROM_REGISTER_FLAG, "1");
  }
  writeFromRegisterCookie();
}

/** 登録完了直後：住民票発行演出を必ず最初から */
export function beginFirstVisitRegisterHandoff(): void {
  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(FROM_REGISTER_FLAG, "1");
    window.sessionStorage.removeItem(RESIDENT_CARD_VIDEO_DONE_FLAG);
  }
  writeFromRegisterCookie();
}

export function clearFirstVisitFromRegisterFlag(): void {
  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem(FROM_REGISTER_FLAG);
  }
  clearFromRegisterCookie();
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

export function readFirstVisitResidentCardVideoDoneFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(RESIDENT_CARD_VIDEO_DONE_FLAG) === "1";
}

export function setFirstVisitResidentCardVideoDoneFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(RESIDENT_CARD_VIDEO_DONE_FLAG, "1");
}

export function clearFirstVisitResidentCardVideoDoneFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(RESIDENT_CARD_VIDEO_DONE_FLAG);
}

function chapterCompleteKey(chapter: FirstVisitChapterNumber): string {
  return `${CHAPTER_COMPLETE_PREFIX}${chapter}`;
}

export function readFirstVisitChapterCompleteFlag(chapter: FirstVisitChapterNumber): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(chapterCompleteKey(chapter)) === "1";
}

export function setFirstVisitChapterCompleteFlag(chapter: FirstVisitChapterNumber): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(chapterCompleteKey(chapter), "1");
  if (chapter === 1) {
    writeOnboardingChapter1CompleteCookie();
  }
}

function writeOnboardingChapter1CompleteCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ONBOARDING_CHAPTER1_COMPLETE_COOKIE}=1; Path=/; Max-Age=${ONBOARDING_CHAPTER1_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function readOnboardingChapter1CompleteCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${ONBOARDING_CHAPTER1_COMPLETE_COOKIE}=1`);
}

export function clearFirstVisitChapterCompleteFlag(chapter: FirstVisitChapterNumber): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(chapterCompleteKey(chapter));
}

export function readFirstVisitChapter3StartedFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(CHAPTER_3_STARTED_FLAG) === "1";
}

export function setFirstVisitChapter3StartedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(CHAPTER_3_STARTED_FLAG, "1");
}

export function clearFirstVisitChapter3StartedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(CHAPTER_3_STARTED_FLAG);
}

export function readFirstVisitPathGuidePrologueWatchedFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(PROLOGUE_WATCHED_FLAG) === "1";
}

export function setFirstVisitPathGuidePrologueWatchedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PROLOGUE_WATCHED_FLAG, "1");
}

export function clearFirstVisitPathGuidePrologueWatchedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PROLOGUE_WATCHED_FLAG);
}

export function readFirstVisitPathGuideWritingHabitDismissedFlag(): boolean {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(PATH_GUIDE_WRITING_HABIT_DISMISSED_FLAG) === "1";
}

export function setFirstVisitPathGuideWritingHabitDismissedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PATH_GUIDE_WRITING_HABIT_DISMISSED_FLAG, "1");
}

export function clearFirstVisitPathGuideWritingHabitDismissedFlag(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PATH_GUIDE_WRITING_HABIT_DISMISSED_FLAG);
}

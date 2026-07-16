import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";

/** 日本の暦年 YYYY（誕生日ギフトの年次キー用） */
export function japanCalendarYearFromDate(date: Date): number {
  const key = calendarDayKeyInJapanFromDate(date);
  return Number.parseInt(key.slice(0, 4), 10);
}

export function birthdayGiftDateKey(year: number): string {
  return `bday-${year}`;
}

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * アカウント代表プロフィールの誕生日が、日本時間の「今日」か。
 * 2/29 生まれは非うるう年は 2/28 に祝う。
 */
export function isAccountBirthdayInJapan(params: {
  birthMonth: number;
  birthDay: number;
  now?: Date;
}): boolean {
  const month = Math.trunc(params.birthMonth);
  const day = Math.trunc(params.birthDay);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const key = calendarDayKeyInJapanFromDate(params.now ?? new Date());
  const year = Number.parseInt(key.slice(0, 4), 10);
  const todayMonth = Number.parseInt(key.slice(5, 7), 10);
  const todayDay = Number.parseInt(key.slice(8, 10), 10);

  if (month === todayMonth && day === todayDay) return true;

  if (month === 2 && day === 29 && todayMonth === 2 && todayDay === 28) {
    return !isGregorianLeapYear(year);
  }
  return false;
}

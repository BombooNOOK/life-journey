import {
  buildPersonalDayLineSeed,
  getPersonalDayLine,
  type DayNumber,
  type MonthNumber,
} from "./data/personalDayLines";
import {
  personalDayNumber,
  personalMonthNumber,
  personalYearNumber,
} from "./personalYearMonth";

export type PersonalDayMessageContext = {
  personalMonthNumber: number;
  personalDayNumber: number;
  date: Date;
  userSeed?: string | number;
};

export type PersonalDayMessageResult = {
  message: string;
  personalMonthNumber: number;
  personalDayNumber: number;
  dateKey: string;
  candidateIndex: number;
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPersonalDayOneLineMessage(
  context: PersonalDayMessageContext,
): PersonalDayMessageResult {
  if (
    context.personalMonthNumber < 1 ||
    context.personalMonthNumber > 9 ||
    context.personalDayNumber < 1 ||
    context.personalDayNumber > 9
  ) {
    return {
      message: "今日は、今の気分をそのまま書き留めてみたい日。",
      personalMonthNumber: context.personalMonthNumber,
      personalDayNumber: context.personalDayNumber,
      dateKey: dateKey(context.date),
      candidateIndex: 0,
    };
  }

  const lineContext = {
    year: context.date.getFullYear(),
    month: context.date.getMonth() + 1,
    day: context.date.getDate(),
    personalMonthNumber: context.personalMonthNumber as MonthNumber,
    personalDayNumber: context.personalDayNumber as DayNumber,
    userId: context.userSeed == null ? undefined : String(context.userSeed),
  };
  const seed = buildPersonalDayLineSeed(lineContext);
  const index = Math.abs(seed) % 4;
  const message = getPersonalDayLine(lineContext);

  return {
    message,
    personalMonthNumber: context.personalMonthNumber,
    personalDayNumber: context.personalDayNumber,
    dateKey: dateKey(context.date),
    candidateIndex: index,
  };
}

export function getPersonalDayOneLineMessageByBirthDate(params: {
  birthMonth: number;
  birthDay: number;
  date: Date;
  userSeed?: string | number;
}): PersonalDayMessageResult {
  const year = params.date.getFullYear();
  const month = params.date.getMonth() + 1;
  const day = params.date.getDate();
  const py = personalYearNumber(params.birthMonth, params.birthDay, year);
  const pm = personalMonthNumber(py, month);
  const pd = personalDayNumber(pm, day);

  return getPersonalDayOneLineMessage({
    personalMonthNumber: pm,
    personalDayNumber: pd,
    date: params.date,
    userSeed: params.userSeed,
  });
}

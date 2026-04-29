type DiaryNumbersInput = {
  birthMonth: number | null;
  birthDay: number | null;
  lifePathNumber: number | null;
  date: Date;
};

export type DiaryNumbers = {
  today: number;
  month: number;
  year: number;
  calmness: number;
};

function reduceToSingleDigit(value: number): number {
  let n = Math.abs(Math.trunc(value));
  while (n > 9) {
    let sum = 0;
    for (const ch of String(n)) sum += Number(ch);
    n = sum;
  }
  return n === 0 ? 9 : n;
}

export function buildDiaryNumbers(input: DiaryNumbersInput): DiaryNumbers {
  const y = input.date.getFullYear();
  const m = input.date.getMonth() + 1;
  const d = input.date.getDate();
  const birthMonth = input.birthMonth ?? 1;
  const birthDay = input.birthDay ?? 1;

  // パーソナルイヤー/月/日を 1..9 に縮約。
  const year = reduceToSingleDigit(birthMonth + birthDay + y);
  const month = reduceToSingleDigit(year + m);
  const today = reduceToSingleDigit(month + d);
  const calmnessBase = input.lifePathNumber ?? year;
  const calmness = reduceToSingleDigit(calmnessBase);

  return { today, month, year, calmness };
}

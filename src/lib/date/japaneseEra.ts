/** 日付を正午ローカルで比較し、タイムゾーンずれを抑える */
function noon(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

export interface EraParts {
  eraKanji: string;
  eraYear: number;
}

/**
 * 和暦（元号・年）を返す。境界日は政府告示に準拠。
 * 対応外の日付は null。
 */
export function resolveJapaneseEra(
  year: number,
  month: number,
  day: number,
): EraParts | null {
  const t = noon(year, month, day);
  const reiwa = noon(2019, 5, 1);
  if (t >= reiwa) {
    return { eraKanji: "令和", eraYear: year - 2018 };
  }
  const heiseiEnd = noon(2019, 4, 30);
  const heiseiStart = noon(1989, 1, 8);
  if (t >= heiseiStart && t <= heiseiEnd) {
    return { eraKanji: "平成", eraYear: year - 1988 };
  }
  const showaEnd = noon(1989, 1, 7);
  const showaStart = noon(1926, 12, 25);
  if (t >= showaStart && t <= showaEnd) {
    return { eraKanji: "昭和", eraYear: year - 1925 };
  }
  const taishoEnd = noon(1926, 12, 24);
  const taishoStart = noon(1912, 7, 30);
  if (t >= taishoStart && t <= taishoEnd) {
    return { eraKanji: "大正", eraYear: year - 1911 };
  }
  const meijiEnd = noon(1912, 7, 29);
  const meijiStart = noon(1868, 10, 23);
  if (t >= meijiStart && t <= meijiEnd) {
    return { eraKanji: "明治", eraYear: year - 1867 };
  }
  return null;
}

/** 例: 1977年4月10日 */
export function formatWesternDateJa(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}年${month}月${day}日`;
}

/** 例: 昭和52年4月10日 / 令和元年5月1日 */
export function formatEraDateJa(
  year: number,
  month: number,
  day: number,
): string {
  const e = resolveJapaneseEra(year, month, day);
  if (!e) {
    return `${year}年${month}月${day}日（和暦未対応）`;
  }
  const yLabel = e.eraYear === 1 ? "元" : String(e.eraYear);
  return `${e.eraKanji}${yLabel}年${month}月${day}日`;
}

export function formatEraDateFromIso(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return `${isoDate}（和暦未対応）`;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return formatEraDateJa(y, mo, d);
}

function eraYearLabel(e: EraParts): string {
  return `${e.eraKanji}${e.eraYear === 1 ? "元" : e.eraYear}年`;
}

/** 年プルダウン用。年内で改元がある場合は両方を併記。 */
export function formatYearOptionLabel(year: number): string {
  const start = resolveJapaneseEra(year, 1, 1);
  const end = resolveJapaneseEra(year, 12, 31);
  if (!start || !end) {
    return `${year}年`;
  }
  if (start.eraKanji === end.eraKanji) {
    return `${year}年（${eraYearLabel(start)}）`;
  }
  return `${year}年（${eraYearLabel(start)}・${eraYearLabel(end)}）`;
}

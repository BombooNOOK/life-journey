import type { ExpectedCoreFivePartial } from "./coreFive";

/**
 * 検証画面の「旧データ」入力欄を ExpectedCoreFivePartial に変換する。
 * 空欄は比較しない。`-` / `null`（大文字小文字無視）は「旧データが null」を意味する。
 */
export function expectedFromVerifyFields(fields: {
  oldLp: string;
  oldD: string;
  oldS: string;
  oldP: string;
  oldBd: string;
}): ExpectedCoreFivePartial {
  const out: ExpectedCoreFivePartial = {};

  const lp = fields.oldLp.trim();
  if (lp !== "") {
    const n = Number(lp);
    if (Number.isFinite(n)) out.lifePathNumber = Math.trunc(n);
  }

  const bd = fields.oldBd.trim();
  if (bd !== "") {
    const n = Number(bd);
    if (Number.isFinite(n)) out.birthdayNumber = Math.trunc(n);
  }

  /** D/S/P は名前由来で null があり得るため - / null を許可 */
  const nullableNum = (s: string, key: "destinyNumber" | "soulNumber" | "personalityNumber") => {
    const t = s.trim();
    if (t === "") return;
    if (t === "-" || t.toLowerCase() === "null") {
      out[key] = null;
      return;
    }
    const n = Number(t);
    if (Number.isFinite(n)) out[key] = Math.trunc(n);
  };

  nullableNum(fields.oldD, "destinyNumber");
  nullableNum(fields.oldS, "soulNumber");
  nullableNum(fields.oldP, "personalityNumber");

  return out;
}

/** CSV 行などへ広げるときの 1 件分の形（入力＋旧コア5） */
export interface VerifyCaseFlat {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  oldLp: string;
  oldD: string;
  oldS: string;
  oldP: string;
  oldBd: string;
}

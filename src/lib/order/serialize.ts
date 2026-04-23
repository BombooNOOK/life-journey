import type { StoneSelection } from "@/lib/stones/types";
import { selectAppraisalStones } from "@/lib/stones/appraisal";
import { STONE_FOCUS_THEME_NONE } from "@/lib/stones/stoneFocusTheme";

import { numerologyWithRefreshedLifePath } from "./numerologyDisplay";
import type { OrderPayload } from "./types";

export function orderPayloadFromOrderRow(row: {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  lastNameRoman: string;
  firstNameRoman: string;
  fullNameDisplay: string;
  fullNameKanaDisplay: string;
  fullNameRomanDisplay: string;
  birthDate: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  numerologyJson: string;
  stonesJson: string;
  stoneFocusTheme?: string | null;
  createdAt?: Date;
}): OrderPayload {
  const numerology = numerologyWithRefreshedLifePath(row.numerologyJson, row.birthDate, {
    birthYear: row.birthYear,
    birthMonth: row.birthMonth,
    birthDay: row.birthDay,
  });
  if (!numerology) {
    throw new Error("numerologyJson の解析に失敗しました");
  }

  const stoneFocusTheme = row.stoneFocusTheme?.trim() || STONE_FOCUS_THEME_NONE;

  return {
    lastName: row.lastName,
    firstName: row.firstName,
    lastNameKana: row.lastNameKana,
    firstNameKana: row.firstNameKana,
    lastNameRoman: row.lastNameRoman,
    firstNameRoman: row.firstNameRoman,
    fullNameDisplay: row.fullNameDisplay,
    fullNameKanaDisplay: row.fullNameKanaDisplay,
    fullNameRomanDisplay: row.fullNameRomanDisplay,
    birthDate: row.birthDate,
    birthYear: row.birthYear,
    birthMonth: row.birthMonth,
    birthDay: row.birthDay,
    postalCode: row.postalCode,
    address: row.address,
    phone: row.phone,
    email: row.email,
    stoneFocusTheme,
    numerology,
    stones: JSON.parse(row.stonesJson) as StoneSelection,
    appraisalStones: selectAppraisalStones(numerology, { focusThemeLabel: stoneFocusTheme }),
    purchaseDateIso: row.createdAt?.toISOString(),
  };
}

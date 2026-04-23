import type { NumerologyResult } from "@/lib/numerology/types";
import type { AppraisalStoneSelection, StoneSelection } from "@/lib/stones/types";

export interface CustomerFormValues {
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
  /** フォーム「今いちばん関心のあること」（候補の並び替えのみに使用） */
  stoneFocusTheme: string;
}

export interface OrderPayload extends CustomerFormValues {
  numerology: NumerologyResult;
  stones: StoneSelection;
  appraisalStones: AppraisalStoneSelection;
  /** 注文作成日時（パーソナルマンス算出の起点月） */
  purchaseDateIso?: string;
}

export function formatDisplayName(c: Pick<CustomerFormValues, "lastName" | "firstName">): string {
  return `${c.lastName} ${c.firstName}`.trim();
}

export function formatKanaDisplay(
  c: Pick<CustomerFormValues, "lastNameKana" | "firstNameKana">,
): string {
  return `${c.lastNameKana} ${c.firstNameKana}`.trim();
}

export function formatRomanDisplay(
  c: Pick<CustomerFormValues, "lastNameRoman" | "firstNameRoman">,
): string {
  return `${c.lastNameRoman} ${c.firstNameRoman}`.trim();
}

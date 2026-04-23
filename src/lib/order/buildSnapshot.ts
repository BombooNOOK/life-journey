import type { BirthDateParts } from "@/lib/numerology/types";
import { romanizeFromKanaParts } from "@/lib/numerology/kanaToRomaji";
import { computeNumerology } from "@/lib/numerology/compute";
import { selectAppraisalStones } from "@/lib/stones/appraisal";
import { selectStones } from "@/lib/stones/select";
import { toIsoDateString } from "@/lib/order/birthDate";
import type { CustomerFormValues, OrderPayload } from "./types";

function parseBirthDate(iso: string): BirthDateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error("生年月日は YYYY-MM-DD で入力してください。");
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  toIsoDateString(year, month, day);
  return { year, month, day };
}

/** ふりがなからローマ字を生成し、数秘に渡すローマ字名を組み立てる */
export function buildOrderPayload(values: CustomerFormValues): OrderPayload {
  const parts = parseBirthDate(values.birthDate);
  const {
    lastNameRoman,
    firstNameRoman,
    romanNameForNumerology,
    romanNameForDisplay,
  } =
    romanizeFromKanaParts(values.lastNameKana, values.firstNameKana);

  const numerology = computeNumerology({
    birthDate: parts,
    romanName: romanNameForNumerology.length ? romanNameForNumerology : null,
  });
  const theme = values.stoneFocusTheme;
  const stones = selectStones(numerology, { focusThemeLabel: theme });
  const appraisalStones = selectAppraisalStones(numerology, { focusThemeLabel: theme });
  return {
    ...values,
    lastNameRoman,
    firstNameRoman,
    fullNameDisplay: `${values.lastName} ${values.firstName}`.trim(),
    fullNameKanaDisplay: `${values.lastNameKana} ${values.firstNameKana}`.trim(),
    fullNameRomanDisplay: romanNameForDisplay,
    numerology,
    stones,
    appraisalStones,
  };
}

import { formatKanteiCodeDatePart, randomKanteiCodeSuffix } from "@/lib/order/kanteiCode";

const DIARY_BINDING_CODE_PREFIX = "LJD";

/** LJD-YYYYMMDD-XXXX（日付は申込作成日・Asia/Tokyo） */
export function buildDiaryBindingCode(issuedAt: Date): string {
  return `${DIARY_BINDING_CODE_PREFIX}-${formatKanteiCodeDatePart(issuedAt)}-${randomKanteiCodeSuffix(4)}`;
}

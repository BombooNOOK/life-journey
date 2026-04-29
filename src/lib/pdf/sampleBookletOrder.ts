import { buildOrderPayload } from "@/lib/order/buildSnapshot";
import type { CustomerFormValues, OrderPayload } from "@/lib/order/types";

/** `scripts/render-sample-booklet.tsx` と同一のダミー注文（LP=1 用の生年月日など） */
const sampleCustomer: CustomerFormValues = {
  lastName: "山田",
  firstName: "太郎",
  lastNameKana: "やまだ",
  firstNameKana: "たろう",
  lastNameRoman: "",
  firstNameRoman: "",
  fullNameDisplay: "",
  fullNameKanaDisplay: "",
  fullNameRomanDisplay: "",
  birthDate: "2008-04-05",
  birthYear: 2008,
  birthMonth: 4,
  birthDay: 5,
  postalCode: "1000001",
  address: "東京都千代田区千代田",
  phone: "090-0000-0000",
  email: "taro@example.com",
  stoneFocusTheme: "none",
};

export function getSampleBookletOrder(): OrderPayload {
  return {
    ...buildOrderPayload(sampleCustomer),
    purchaseDateIso: "2026-04-01T12:00:00Z",
  };
}

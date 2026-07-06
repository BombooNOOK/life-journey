import type { FirstVisitOwlFrameLabelPlacement } from "@/lib/onboarding/firstVisitResidentRegistrationFrameLayout";
import { FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_COLOR } from "@/lib/onboarding/firstVisitResidentRegistrationFrameLayout";

/** ログハウス建築案内（フクロウ先生コメント枠・480 設計座標） */
export const FIRST_VISIT_LOGHOUSE_SIGN_OWL_FRAME_LABEL_PLACEMENT: FirstVisitOwlFrameLabelPlacement = {
  x: 240,
  y: 178,
  textAnchor: "center",
  textAlign: "center",
  fontSize: 19,
  fontWeight: 600,
  lineHeight: 1.55,
  color: FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_LABEL_COLOR,
};

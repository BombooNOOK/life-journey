import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";
import { FOREST_RESIDENT_DEFAULT_DISPLAY_NAME } from "@/lib/forestResident/forestResidentNumber";

/** 初回導線プレビュー用のサンプル住民票 */
export const FIRST_VISIT_RESIDENT_CARD_PREVIEW_FIXTURE: ForestResidentCardData = {
  residentNumber: "BN-000802079",
  displayName: FOREST_RESIDENT_DEFAULT_DISPLAY_NAME,
  registeredAtLabel: "2026年7月6日",
  faceIcon: "rabbit",
  badge: "green",
  issuedAt: "2026-07-06T00:00:00.000Z",
};

/** 住民票カードのクライアント共有型・定数（サーバ専用依存なし） */

export const FOREST_RESIDENT_DEFAULT_DISPLAY_NAME = "森の住民" as const;

export type ForestResidentBadge = "green" | "silver" | "gold";
export type ForestResidentFaceIcon = "rabbit";

export type ForestResidentCardData = {
  residentNumber: string;
  displayName: string;
  registeredAtLabel: string;
  faceIcon: ForestResidentFaceIcon;
  badge: ForestResidentBadge;
  issuedAt: string;
};

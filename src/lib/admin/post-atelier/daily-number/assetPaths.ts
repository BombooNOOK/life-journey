import fs from "node:fs";
import path from "node:path";

import { DAILY_NUMBER_TEMPLATE_SIZE } from "./imageLayout";
import type { DailyNumberClosingVariant, DailyNumberCharacter } from "./types";

export { DAILY_NUMBER_TEMPLATE_SIZE };

const TEMPLATE_DIR = path.join(
  process.cwd(),
  "public/images/post-atelier/daily-number",
);

function templatePath(filename: string): string {
  return path.join(TEMPLATE_DIR, filename);
}

export function dailyNumberCoverTemplatePath(character: DailyNumberCharacter): string {
  return templatePath(`daily-number-cover-${character}.png`);
}

export function dailyNumberExplainTemplatePath(character: DailyNumberCharacter): string {
  return templatePath(`daily-number-explain-${character}.png`);
}

export function dailyNumberPersonalTemplatePath(pageIndex1Based: number): string {
  const padded = String(pageIndex1Based).padStart(2, "0");
  return templatePath(`daily-number-personal-page_${padded}.png`);
}

const CLOSING_TEMPLATE_DIR = path.join(TEMPLATE_DIR, "closing");

function closingTemplatePath(filename: string): string {
  return path.join(CLOSING_TEMPLATE_DIR, filename);
}

/** ラストページ背景（819×1024）。Canva 完成 PNG をそのまま置く場合は bg のみで OK。 */
export function dailyNumberClosingBackgroundPath(variant: DailyNumberClosingVariant): string {
  return closingTemplatePath(`daily-number-closing-${variant}-bg.png`);
}

/** ラストページ文字入りオーバーレイ（819×1024・透明背景） */
export function dailyNumberClosingOverlayPath(variant: DailyNumberClosingVariant): string {
  return closingTemplatePath(`daily-number-closing-${variant}-overlay.png`);
}

export function dailyNumberClosingOverlayExists(variant: DailyNumberClosingVariant): boolean {
  return fs.existsSync(dailyNumberClosingOverlayPath(variant));
}

export function assertDailyNumberTemplateExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`テンプレート画像が見つかりません: ${filePath}`);
  }
}

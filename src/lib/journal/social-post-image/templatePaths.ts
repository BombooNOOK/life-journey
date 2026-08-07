import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostBackgroundFile,
  resolveJournalSocialPostDesignSize,
  type JournalSocialPostTemplateId,
} from "./templates";
import { prepareJournalSocialPostPhotoOverlay } from "./photoOverlayPrepare";

export function journalSocialPostTemplateBackgroundPath(
  templateId: JournalSocialPostTemplateId,
  companionType?: string,
): string {
  const backgroundFile = companionType
    ? resolveJournalSocialPostBackgroundFile(templateId, companionType)
    : JOURNAL_SOCIAL_POST_TEMPLATES[templateId].backgroundFile;
  return path.join(process.cwd(), "public/images/journal-social-post", backgroundFile);
}

export function journalSocialPostTemplatePhotoOverlayPath(
  templateId: JournalSocialPostTemplateId,
): string | null {
  const overlayFile = JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photoOverlayFile;
  if (!overlayFile) return null;
  return path.join(process.cwd(), "public/images/journal-social-post", overlayFile);
}

export function loadJournalSocialPostTemplateBackground(
  templateId: JournalSocialPostTemplateId,
  companionType?: string,
): Buffer {
  const filePath = journalSocialPostTemplateBackgroundPath(templateId, companionType);
  if (!fs.existsSync(filePath)) {
    throw new Error(`テンプレートが見つかりません: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

/**
 * 前面オーバーレイを読み込み、設計サイズへ揃える。
 * Canva が出力解像度（1080系）で書き出しても、合成は設計サイズ（819／576）基準のため
 * sharp の「overlay must be same or smaller」失敗を防ぐ。
 */
export async function loadJournalSocialPostTemplatePhotoOverlay(
  templateId: JournalSocialPostTemplateId,
): Promise<Buffer | null> {
  const filePath = journalSocialPostTemplatePhotoOverlayPath(templateId);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath);
  const prepared = await prepareJournalSocialPostPhotoOverlay(raw);
  const design = resolveJournalSocialPostDesignSize(JOURNAL_SOCIAL_POST_TEMPLATES[templateId]);
  const meta = await sharp(prepared).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === design.widthPx && height === design.heightPx) {
    return prepared;
  }
  return sharp(prepared)
    .resize(design.widthPx, design.heightPx, { fit: "fill" })
    .png()
    .toBuffer();
}

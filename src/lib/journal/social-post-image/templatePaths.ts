import fs from "node:fs";
import path from "node:path";

import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostBackgroundFile,
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

export async function loadJournalSocialPostTemplatePhotoOverlay(
  templateId: JournalSocialPostTemplateId,
): Promise<Buffer | null> {
  const filePath = journalSocialPostTemplatePhotoOverlayPath(templateId);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath);
  return prepareJournalSocialPostPhotoOverlay(raw);
}

import fs from "node:fs";
import path from "node:path";

import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./types";

/** 差し替え可能な背景 PNG（文字なし・1080×1350） */
export const JOURNAL_SOCIAL_POST_BACKGROUND_REL =
  "public/images/journal-social-post/background-1080x1350.png";

export function journalSocialPostBackgroundPath(): string {
  return path.join(process.cwd(), JOURNAL_SOCIAL_POST_BACKGROUND_REL);
}

export function journalSocialPostBackgroundExists(): boolean {
  return fs.existsSync(journalSocialPostBackgroundPath());
}

export function assertJournalSocialPostBackgroundExists(): void {
  if (!journalSocialPostBackgroundExists()) {
    throw new Error(
      `SNS投稿画像の背景が見つかりません: ${JOURNAL_SOCIAL_POST_BACKGROUND_REL}（1080×1350 の PNG を配置してください）`,
    );
  }
}

export { JOURNAL_SOCIAL_POST_IMAGE_SIZE };
